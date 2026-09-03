-- ============================================================
-- FREELANCE CRM — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgcrypto for AES-256 credential encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLAS
-- ============================================================

-- contactos (leads / clientes en el embudo)
CREATE TABLE IF NOT EXISTS contactos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  rubro text,
  canal text CHECK (canal IN ('whatsapp','referido','flyer','redes','otro')),
  fecha_contacto date DEFAULT CURRENT_DATE,
  telefono text,
  estado text NOT NULL DEFAULT 'contactado'
    CHECK (estado IN (
      'contactado','descubrimiento','propuesta_enviada',
      'contrato_firmado','en_desarrollo','entregado',
      'mantenimiento','perdido'
    )),
  vigencia_propuesta date,
  proxima_accion text,
  fecha_proxima_accion date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- proyectos / sistemas entregados
CREATE TABLE IF NOT EXISTS proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contacto_id uuid REFERENCES contactos(id) ON DELETE SET NULL,
  nombre text NOT NULL,
  url_produccion text,
  tecnologias text[],
  notas text,
  es_practica boolean DEFAULT false,
  costo_total numeric(12,2),
  estado text NOT NULL DEFAULT 'en_desarrollo'
    CHECK (estado IN ('en_desarrollo','entregado','mantenimiento','pausado')),
  -- Mantenimiento mensual
  monto_mantenimiento numeric(12,2),
  dia_cobro_mantenimiento integer CHECK (dia_cobro_mantenimiento BETWEEN 1 AND 31),
  modo_cobro_mantenimiento text CHECK (modo_cobro_mantenimiento IN ('automatico','manual')),
  -- Pago del proyecto
  anticipo_monto numeric(12,2),
  anticipo_fecha date,
  anticipo_estado text CHECK (anticipo_estado IN ('pendiente','parcial','pagado','vencido')),
  saldo_monto numeric(12,2),
  saldo_fecha date,
  saldo_estado text CHECK (saldo_estado IN ('pendiente','parcial','pagado','vencido')),
  metodo_pago text,
  -- Revisiones
  revisiones_incluidas integer DEFAULT 2,
  revisiones_usadas integer DEFAULT 0,
  -- Fechas de entrega
  fecha_entrega_estimada date,
  fecha_entrega_real date,
  -- Imagen (Cloudinary)
  imagen_url text,
  imagen_public_id text,
  -- Deploy
  plataforma_deploy text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- project_credentials — credenciales CIFRADAS de terceros
-- NUNCA se retorna en queries generales de proyectos
CREATE TABLE IF NOT EXISTS project_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  servicio text NOT NULL,  -- 'supabase','netlify','cloudinary','otro'
  usuario_cifrado bytea NOT NULL,
  password_cifrado bytea NOT NULL,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- citas programadas
CREATE TABLE IF NOT EXISTS citas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_hora timestamptz NOT NULL,
  tipo text DEFAULT 'otro'
    CHECK (tipo IN ('llamada','reunion','entrega','capacitacion','otro')),
  contacto_id uuid REFERENCES contactos(id) ON DELETE SET NULL,
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz DEFAULT now()
);

-- gastos / costos
CREATE TABLE IF NOT EXISTS gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  concepto text NOT NULL,
  monto numeric(12,2) NOT NULL,
  categoria text DEFAULT 'otro'
    CHECK (categoria IN ('herramientas','transporte','dominio','publicidad','otro')),
  periodicidad text DEFAULT 'unico'
    CHECK (periodicidad IN ('unico','semanal','mensual')),
  created_at timestamptz DEFAULT now()
);

-- movimientos_caja (ledger contable)
-- Saldo = SUM(ingresos) - SUM(egresos) sobre todos los registros
-- Movimientos manuales: editables/eliminables
-- Movimientos automáticos (proyecto/gasto/mantenimiento): protegidos en la app
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  monto numeric(12,2) NOT NULL,
  concepto text NOT NULL,
  origen text DEFAULT 'manual'
    CHECK (origen IN ('proyecto','gasto','mantenimiento','manual')),
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE SET NULL,
  gasto_id uuid REFERENCES gastos(id) ON DELETE CASCADE,
  -- Clave de idempotencia para movimientos automáticos de mantenimiento
  -- Formato: mant_{proyecto_id}_{YYYY-MM}
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- horas_trabajadas (solo informativo, sin efecto en cálculos)
CREATE TABLE IF NOT EXISTS horas_trabajadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  horas numeric(5,2) NOT NULL CHECK (horas > 0),
  nota text,
  created_at timestamptz DEFAULT now()
);

-- notas (entidad ligera reutilizable)
CREATE TABLE IF NOT EXISTS notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  texto text NOT NULL,
  fecha date DEFAULT CURRENT_DATE,
  contacto_id uuid REFERENCES contactos(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Saldo inicial: 200 Bs
INSERT INTO movimientos_caja (fecha, tipo, monto, concepto, origen, idempotency_key)
VALUES (CURRENT_DATE, 'ingreso', 200, 'Saldo inicial del sistema', 'manual', 'saldo_inicial_sistema')
ON CONFLICT (idempotency_key) DO NOTHING;

-- ============================================================
-- FUNCIÓN ATÓMICA: registrar cobro de proyecto
-- Actualiza estado de pago Y crea movimiento en caja en una sola transacción
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_cobro_proyecto(
  p_proyecto_id uuid,
  p_campo text,        -- 'anticipo' o 'saldo'
  p_nuevo_estado text, -- 'pendiente','parcial','pagado','vencido'
  p_monto numeric,
  p_concepto text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo genera movimiento cuando se marca como pagado
  IF p_nuevo_estado = 'pagado' THEN
    INSERT INTO movimientos_caja (fecha, tipo, monto, concepto, origen, proyecto_id, idempotency_key)
    VALUES (
      CURRENT_DATE,
      'ingreso',
      p_monto,
      p_concepto,
      'proyecto',
      p_proyecto_id,
      'cobro_' || p_campo || '_' || p_proyecto_id::text
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- Actualiza el estado de pago del campo correspondiente
  IF p_campo = 'anticipo' THEN
    UPDATE proyectos SET anticipo_estado = p_nuevo_estado, updated_at = now()
    WHERE id = p_proyecto_id;
  ELSIF p_campo = 'saldo' THEN
    UPDATE proyectos SET saldo_estado = p_nuevo_estado, updated_at = now()
    WHERE id = p_proyecto_id;
  END IF;
END;
$$;

-- ============================================================
-- FUNCIÓN ATÓMICA: crear gasto + movimiento de caja
-- ============================================================
CREATE OR REPLACE FUNCTION crear_gasto_con_movimiento(
  p_fecha date,
  p_concepto text,
  p_monto numeric,
  p_categoria text,
  p_periodicidad text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gasto_id uuid;
BEGIN
  INSERT INTO gastos (fecha, concepto, monto, categoria, periodicidad)
  VALUES (p_fecha, p_concepto, p_monto, p_categoria, p_periodicidad)
  RETURNING id INTO v_gasto_id;

  INSERT INTO movimientos_caja (fecha, tipo, monto, concepto, origen, gasto_id)
  VALUES (p_fecha, 'egreso', p_monto, p_concepto, 'gasto', v_gasto_id);

  RETURN v_gasto_id;
END;
$$;

-- ============================================================
-- FUNCIÓN: generar movimientos automáticos de mantenimiento
-- Llamada periódicamente (keep-alive o manualmente)
-- Idempotente: no genera duplicados para el mismo proyecto+mes
-- ============================================================
CREATE OR REPLACE FUNCTION generar_movimientos_mantenimiento(p_mes text DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mes text;
  v_count int := 0;
  r record;
BEGIN
  v_mes := COALESCE(p_mes, to_char(CURRENT_DATE, 'YYYY-MM'));

  FOR r IN
    SELECT id, nombre, monto_mantenimiento
    FROM proyectos
    WHERE estado = 'mantenimiento'
      AND modo_cobro_mantenimiento = 'automatico'
      AND monto_mantenimiento IS NOT NULL
      AND monto_mantenimiento > 0
  LOOP
    INSERT INTO movimientos_caja (fecha, tipo, monto, concepto, origen, proyecto_id, idempotency_key)
    VALUES (
      (v_mes || '-01')::date,
      'ingreso',
      r.monto_mantenimiento,
      'Mantenimiento ' || r.nombre || ' — ' || v_mes,
      'mantenimiento',
      r.id,
      'mant_' || r.id::text || '_' || v_mes
    )
    ON CONFLICT (idempotency_key) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- Un solo usuario admin — política: solo autenticados pueden operar
-- ============================================================

ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE horas_trabajadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;

-- Políticas: solo usuarios autenticados pueden leer y escribir
CREATE POLICY "auth_only_contactos" ON contactos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_proyectos" ON proyectos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_credentials" ON project_credentials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_citas" ON citas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_gastos" ON gastos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_caja" ON movimientos_caja FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_horas" ON horas_trabajadas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_only_notas" ON notas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Las funciones SECURITY DEFINER corren con permisos de quien las definió (postgres)
-- Permitir que usuarios autenticados las llamen
GRANT EXECUTE ON FUNCTION registrar_cobro_proyecto TO authenticated;
GRANT EXECUTE ON FUNCTION crear_gasto_con_movimiento TO authenticated;
GRANT EXECUTE ON FUNCTION generar_movimientos_mantenimiento TO authenticated;
