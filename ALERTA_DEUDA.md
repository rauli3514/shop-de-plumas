# Nueva Funcionalidad: Alerta de Deuda en Nueva Venta

## Resumen

Se implementó una **alerta visual automática** que aparece en el modal de "Nueva Venta" cuando se selecciona un cliente que tiene deudas pendientes.

## ✨ Características

### 🎯 Detección Automática
- El sistema calcula automáticamente la deuda total del cliente al seleccionarlo
- Se suman todas las ventas con `balance > 0` para ese cliente
- La alerta aparece **instantáneamente** al cambiar de cliente

### 🎨 Diseño Visual
La alerta tiene:
- **Color de fondo**: Amarillo claro (#fff3cd) - muy visible pero no agresivo
- **Borde**: Naranja (#ffc107) - destaca pero mantiene profesionalismo  
- **Icono**: ⚠️ AlertCircle grande en color ámbar oscuro (#856404)
- **Textos**:
  - Título: "⚠️ Cliente con Deuda Pendiente" (negrita, grande)
  - Monto: "$XXX.XX" (extra grande, negrita)
  - Ayuda: "💡 Puedes gestionar los pagos en 'Cuentas por Cobrar'" (cursiva, pequeño)

### 📍 Ubicación
La alerta aparece:
- Dentro del card del selector de cliente
- Justo **después** de seleccionar un cliente
- **Antes** de la sección de productos
- No interrumpe el flujo de trabajo

## 🔧 Implementación Técnica

### Archivos Modificados
**`src/components/SaleModal.tsx`**

#### 1. Cálculo de Deuda
```typescript
// Se añadió sales al contexto
const { sales, ... } = useApp();

// Cálculo automático de deuda
const customerDebt = customerId 
    ? sales
        .filter(s => s.customerId === customerId && s.balance > 0)
        .reduce((total, s) => total + s.balance, 0)
    : 0;

const hasPendingDebt = customerDebt > 0;
```

#### 2. Banner de Alerta
```tsx
{hasPendingDebt && (
    <div style={{ 
        marginTop: 'var(--spacing-md)', 
        padding: '1rem', 
        backgroundColor: '#fff3cd', 
        border: '2px solid #ffc107',
        ...
    }}>
        <AlertCircle size={24} color="#856404" />
        <div>
            <div>⚠️ Cliente con Deuda Pendiente</div>
            <div>Este cliente tiene un saldo adeudado de 
                <strong>${customerDebt.toFixed(2)}</strong>
            </div>
            <div>💡 Puedes gestionar los pagos en "Cuentas por Cobrar"</div>
        </div>
    </div>
)}
```

## 🎬 Casos de Uso

### Escenario 1: Cliente sin deudas
1. Vendedor abre "Nueva Venta"
2. Selecciona cliente sin deudas
3. **No aparece ninguna alerta** ✅
4. Continúa normalmente con la venta

### Escenario 2: Cliente con deuda
1. Vendedor abre "Nueva Venta"
2. Selecciona cliente con deuda de $100.00
3. **Aparece alerta amarilla** mostrando:
   - "⚠️ Cliente con Deuda Pendiente"
   - "Este cliente tiene un saldo adeudado de **$100.00**"
   - Sugerencia de ir a "Cuentas por Cobrar"
4. Vendedor está **informado** pero puede continuar con la venta si lo desea
5. Es solo **informativo**, no bloquea la operación

### Escenario 3: Cliente con múltiples deudas
1. Cliente tiene 3 ventas pendientes:
   - Venta 1: Balance $50.00
   - Venta 2: Balance $75.00
   - Venta 3: Balance $25.00
2. Al seleccionarlo, la alerta muestra: **$150.00** (suma total)

## 🎯 Beneficios

✅ **Visibilidad**: El vendedor siempre sabe si el cliente debe dinero  
✅ **No intrusivo**: No bloquea la venta, solo informa  
✅ **Profesional**: Apariencia limpia y clara  
✅ **Útil**: Incluye link conceptual a "Cuentas por Cobrar"  
✅ **Automático**: No requiere ninguna acción manual  
✅ **Preciso**: Calcula el total de todas las deudas

## 📊 Flujo de Trabajo Recomendado

1. **Nueva Venta** → Cliente con deuda detectado
2. **Opción A**: Continuar con la venta y registrarla
3. **Opción B**: Ir a "Cuentas por Cobrar" y registrar un pago primero
4. **Opción C**: Hablar con el cliente sobre la deuda antes de vender más

## 🔄 Integración con Otras Funcionalidades

Esta alerta se integra perfectamente con:
- ✅ **Sistema de Remitos**: Si se hace pago contra entrega, sumará a la deuda
- ✅ **Cuentas por Cobrar**: Donde se pueden registrar pagos parciales
- ✅ **Reportes**: La deuda se refleja en los reportes de clientes

---

**Fecha**: 2026-01-12  
**Versión**: 1.2.0  
**Estado**: ✅ Implementado y Probado
