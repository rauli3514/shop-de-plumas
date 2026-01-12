# 🌍 Sistema de Múltiples Divisas - Plan de Implementación

## Fecha: 2026-01-12

---

## 📋 Requisitos

### ✅ Funcionalidades Core
1. ✅ Soportar ARS y USD (extensible)
2. ✅ Guardar precios y costos en su moneda original
3. ✅ Registrar y congelar tipo de cambio por operación
4. ⏳ No recalcular operaciones históricas (en progreso)
5. ⏳ Permitir reportes en moneda original y moneda base
6. ⏳ Mane jar cotizaciones offline usando último valor guardado
7. ⏳ Mostrar cotización utilizada en cada venta y remito
8. ⏳ Evitar mezcla de monedas sin conversión explícita
9. ⏳ Link a https://dolarhoy.com/ para consultar cotización

---

## 🏗️ Arquitectura

### Tipos Creados (`src/types.ts`)

```typescript
// Monedas soportadas
type Currency = 'ARS' | 'USD';

// Tipo de cambio con snapshot histórico
interface ExchangeRate {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number; // Ej: 1 USD = 1000 ARS
  date: Date;
  source: string;
}

// Monto con moneda
interface CurrencyAmount {
  amount: number;
  currency: Currency;
}

// Snapshot de conversión en una operación
interface ConversionSnapshot {
  originalAmount: number;
  originalCurrency: Currency;
  convertedAmount: number;
  convertedCurrency: Currency;
  exchangeRate: number;
  exchangeRateDate: Date;
}
```

### Interfaces Modificadas

#### Product
```typescript
interface Product {
  // ... campos existentes
  currency: Currency; // ARS o USD
}
```

#### SaleItem
```typescript
interface SaleItem {
  // ... campos existentes
  currency: Currency; // Moneda original del producto
}
```

#### Sale  
```typescript
interface Sale {
  // ... campos existentes
  currency: Currency; // Moneda en la que se realizó la venta
  exchangeRateSnapshot?: ExchangeRate; // TC congelado
}
```

---

## 🛠️ Helpers Creados (`src/utils/currency.ts`)

### Configuración
- `SUPPORTED_CURRENCIES`: ['ARS', 'USD']
- `CURRENCY_SYMBOLS`: { ARS: '$', USD: 'U$D' }
- `BASE_CURRENCY`: 'ARS'
- `EXCHANGE_RATE_URL`: 'https://dolarhoy.com/'

### Funciones

#### Formato
```typescript
formatCurrency(amount: number, currency: Currency): string
// Ej: formatCurrency(1500, 'ARS') => "$1500.00"
// Ej: formatCurrency(10, 'USD') => "U$D10.00"
```

#### Conversión
```typescript
convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate: number
): number
// Ej: convertCurrency(10, 'USD', 'ARS', 1000) => 10000
```

#### Tipo de Cambio
```typescript
getLastExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: ExchangeRate[]
): ExchangeRate | null
// Obtiene el último TC guardado
```

```typescript
createExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  rate: number,
  source?: string
): ExchangeRate
```

#### Validación
```typescript
validateCurrencyMix(currencies: Currency[]): boolean
// Valida que no haya mezcla de monedas
```

#### Reportes
```typescript
convertToBaseCurrency(
  amounts: CurrencyAmount[],
  exchangeRates: ExchangeRate[]
): number
// Convierte múltiples montos a ARS
```

---

## 📝 Próximos Pasos

### 1. Context (AppContext.tsx)
- [ ] Agregar estado `exchangeRates: ExchangeRate[]`
- [ ] Agregar función `addExchangeRate()`
- [ ] Agregar función `getActiveExchangeRate()`
- [ ] Persistir en localStorage

### 2. UI de Productos
- [ ] Agregar selector de moneda en ProductModal
- [ ] Mostrar símbolo de moneda en tabla de productos
- [ ] Filtrar por moneda

### 3. UI de Ventas (SaleModal)
- [ ] Selector de moneda de venta
- [ ] Mostrar tipo de cambio actual
- [ ] Link a DolarHoy.com
- [ ] Validar mezcla de monedas
- [ ] Convertir si es necesario
- [ ] Congelar TC en la venta

### 4. PDFs
- [ ] Mostrar moneda y TC en recibos
- [ ] Mostrar moneda en remitos
- [ ] Detalle de conversión si aplica

### 5. Reportes
- [ ] Selector de vista: moneda original o ARS
- [ ] Conversión automática a ARS
- [ ] Gráficos multi-moneda

### 6. Admin
- [ ] Pantalla de configuración de TC
- [ ] Historial de tipos de cambio
- [ ] Actualización manual de TC

---

## 🎯 Reglas de Negocio

### Productos
1. Cada producto tiene UNA moneda fija
2. El precio y costo están en esa moneda
3. Al cambiar moneda, se debe actualizar el precio manual mente

### Ventas
1. La venta se realiza en UNA moneda (ARS o USD)
2. Si hay productos en diferentes monedas, se convierten
3. El TC usado se congela en `exchangeRateSnapshot`
4. **NUNCA** se recalcula una venta histórica

### Tipo de Cambio
1. Se usa el último TC guardado
2. Si no hay TC, se solicita manual
3. El TC se guarda con timestamp
4. Cada venta guarda su propio TC (snapshot)

### Reportes
1. Pueden verse en moneda original
2. Pueden convertirse a ARS (moneda base)
3. Se usa el TC de cada operación (no el actual)

---

## ⚠️ Consideraciones Importantes

### Migración de Datos Existentes
- Los productos existentes se asign arán a ARS por defecto
- Las ventas existentes se marcarán como ARS
- Se creará un TC inicial USD->ARS (ej: 1000)

### Performance
- Los TC se guardan en memoria (localStorage)
- No se hacen consultas a APIs externas
- Todo offline excepto link a DolarHoy (referencia)

### UX
- Símbolos claros ($ vs U$D)
- Warnings si se mezclan monedas
- Link visible a DolarHoy
- TC congelado visible en cada venta

---

**Desarrollado por**: Antigravity AI Assistant  
**Fecha**: 2026-01-12  
**Estado**: 🚧 En Implementación (30% completo)
