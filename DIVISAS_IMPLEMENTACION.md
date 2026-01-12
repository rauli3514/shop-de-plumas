# 🚧 Sistema de Divisas - Implementación Completa

## Estado Actual: En Progreso (40%)

---

## ✅ Completado

### Tipos (`src/types.ts`)
- ✅ `Currency`, `ExchangeRate`, `CurrencyAmount`
- ✅ `Product.currency`
- ✅ `SaleItem.currency`
- ✅ `Sale.currency` y `Sale.exchangeRateSnapshot`

### Helpers (`src/utils/currency.ts`)
- ✅ Todas las funciones de conversión y formato

### Context (Parcial)
- ✅ Interfaces actualizadas
- ⏳ Implementación pendiente

---

## 🔧 Errores de Compilación a Resolver

### 1. ProductModal
**Error**: Falta `currency` al crear producto

**Solución**: Agregar selector de moneda
```typescript
// Agregar estado
const [currency, setCurrency] = useState<Currency>('ARS');

// Agregar al form
<select value={currency} onChange={e => setCurrency(e.target.value)}>
  <option value="ARS">ARS ($)</option>
  <option value="USD">USD (U$D)</option>
</select>

// Pasar al crear
addProduct({ ...data, currency });
```

### 2. SaleModal  
**Error**: Falta `currency` en SaleItem y Sale

**Solución**: Obtener currency del producto y calcular venta
```typescript
// Al agregar item
const item: SaleItem = {
  ...itemData,
  currency: product.currency // Del producto
};

// Al crear venta
const sale = {
  ...saleData,
  currency: 'ARS', // Moneda de la venta
  exchangeRateSnapshot: getCurrentRate() // Si aplica
};
```

### 3. AppContext
**Error**: Faltan `exchangeRates`, `addExchangeRate`, `getActiveExchangeRate`

**Solución**: Implementar en el provider
```typescript
const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(() => {
  const saved = localStorage.getItem('exchangeRates');
  if (saved) return JSON.parse(saved);
  // Crear rate inicial
  return [createInitialRate()];
});

const addExchangeRate = (rate: Omit<ExchangeRate, 'id' | 'date'>) => {
  const newRate: ExchangeRate = {
    ...rate,
    id: crypto.randomUUID(),
    date: new Date()
  };
  setExchangeRates(prev => [...prev, newRate]);
};

const getActiveExchangeRate = (from: Currency, to: Currency) => {
  return getLastExchangeRate(from, to, exchangeRates);
};
```

---

## 📝 Tareas Pendientes (Orden de Prioridad)

### Alta Prioridad (Bloqueante)
1. [ ] **AppContext**: Implementar estado y funciones de `exchangeRates`
2. [ ] **Datos iniciales**: Migrar productos existentes a ARS
3. [ ] **ProductModal**: Agregar selector de moneda
4. [ ] **SaleModal**: Manejar currency en items y venta

### Media Prioridad (Funcional)
5. [ ] **SaleModal**: Selector de moneda de venta
6. [ ] **SaleModal**: Validación de mezcla de divisas
7. [ ] **SaleModal**: Link a DolarHoy.com
8. [ ] **SaleModal**: Mostrar tipo de cambio actual
9. [ ] **PDFs**: Mostrar moneda en recibos y remitos

### Baja Prioridad (Mejoras)
10. [ ] **Admin**: Pantalla de configuración de TC
11. [ ] **Reportes**: Vista multi-moneda
12. [ ] **Components**: Componente CurrencyInput reutilizable

---

## 🎯 Próximos Pasos Inmediatos

### Paso 1: App Context Completo (CRÍTICO)
Archivo: `src/context/AppContext.tsx`

Agregar al provider (línea ~60):
```typescript
const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>(() => {
  const saved = localStorage.getItem('exchangeRates');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((r: any) => ({
        ...r,
        date: new Date(r.date)
      }));
    } catch {
      return [];
    }
  }
  // Crear TC inicial USD -> ARS
  return [{
    id: crypto.randomUUID(),
    fromCurrency: 'USD',
    toCurrency: 'ARS',
    rate: 1000, // Valor inicial
    date: new Date(),
    source: 'Inicial'
  }];
});

// Persistir
useEffect(() => {
  localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
}, [exchangeRates]);

// Funciones
const addExchange Rate = (rate: Omit<ExchangeRate, 'id' | 'date'>) => {
  const newRate: ExchangeRate = {
    ...rate,
    id: crypto.randomUUID(),
    date: new Date()
  };
  setExchangeRates(prev => [...prev, newRate]);
};

const getActiveExchangeRate = (fromCurrency: Currency, toCurrency: Currency) => {
  if (fromCurrency === toCurrency) return null;
  const rates = exchangeRates
    .filter(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return rates[0] || null;
};
```

Agregar al return del provider (línea ~373):
```typescript
return (
  <AppContext.Provider value={{
    // ... otros valores
    exchangeRates,
    addExchangeRate,
    getActiveExchangeRate,
    // ... resto
  }}>
```

### Paso 2: Migrar Productos Existentes
En `AppContext.tsx`, al cargar productos de localStorage:

```typescript
const [products, setProducts] = useState<Product[]>(() => {
  const saved = localStorage.getItem('products');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // MIGRACIÓN: Agregar currency a productos sin ella
      return parsed.map((p: any) => ({
        ...p,
        currency: p.currency || 'ARS', // Default ARS
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch {
      return [];
    }
  }
  return [];
});
```

### Paso 3: ProductModal - Selector de Moneda
Archivo: `src/components/ProductModal.tsx`

Agregar estado (línea ~15):
```typescript
const [currency, setCurrency] = useState<Currency>(
  product?.currency || 'ARS'
);
```

Agregar al form (después del campo price, línea ~120):
```tsx
<div className="form-group">
  <label className="form-label">Moneda</label>
  <select
    className="select"
    value={currency}
    onChange={e => setCurrency(e.target.value as Currency)}
  >
    <option value="ARS">ARS - Peso Argentino ($)</option>
    <option value="USD">USD - Dólar (U$D)</option>
  </select>
</div>
```

Actualizar submit (línea ~60):
```typescript
if (product) {
  updateProduct(product.id, {
    // ... campos existentes
    currency
  });
} else {
  addProduct({
    // ... campos existentes
    currency
  });
}
```

### Paso 4: SaleModal - Currency en Items
Archivo: `src/components/SaleModal.tsx`

Al agregar item al carrito (línea ~74):
```typescript
const newItem: SaleItem = {
  productId: selectedProduct.id,
  productName: selectedProduct.name,
  quantity: qty,
  unitPrice: selectedProduct.price,
  currency: selectedProduct.currency, // ← AGREGAR
  subtotal: selectedProduct.price * qty,
  cost: selectedProduct.cost * qty,
  profit: (selectedProduct.price - selectedProduct.cost) * qty,
};
```

Al crear la venta (línea ~143):
```typescript
const { sale, deliveryNote } = addSale({
  // ... campos existentes
  currency: 'ARS', // Por ahora fijo
  exchangeRateSnapshot: undefined // Por ahora
}, paymentType);
```

---

## 📊 Estimación de Tiempo

- AppContext: 5 min
- ProductModal: 3 min  
- SaleModal: 5 min
- Migración: 2 min
- Pruebas: 5 min

**Total**: ~20 minutos para funcionalidad básica

---

## 🎯 MVP vs Completo

### MVP (Mínimo Viable)
- ✅ Productos pueden ser ARS o USD
- ✅ Se guarda moneda original
- ✅ Ventas se crean (sin conversión aún)
- ✅ Compila y funciona básicamente

### Completo (Full Feature)
- Conversión automática en ventas
- Validación de mezcla de monedas
- Link a DolarHoy
- PDFs con TC
- Admin de TC
- Reportes multidivisa

**Decisión**: Implementar MVP primero, luego expandir

---

**Desarrollado por**: Antigravity AI Assistant  
**Fecha**: 2026-01-12  
**Estado**: 🚧 40% Completo - Requiere acciones manuales
