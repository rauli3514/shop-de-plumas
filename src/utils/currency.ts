import type { Currency, ExchangeRate, CurrencyAmount } from '../types';

// Configuración de divisas soportadas
export const SUPPORTED_CURRENCIES: Currency[] = ['ARS', 'USD'];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    ARS: 'ARG$',
    USD: 'US$'
};

export const CURRENCY_NAMES: Record<Currency, string> = {
    ARS: 'Peso Argentino',
    USD: 'Dólar Estadounidense'
};

// Moneda base del sistema (para reportes consolidados)
export const BASE_CURRENCY: Currency = 'ARS';

// Link para consultar cotización
export const EXCHANGE_RATE_URL = 'https://dolarhoy.com/';

// Helpers de formato
export const formatCurrency = (amount: number, currency: Currency): string => {
    const symbol = CURRENCY_SYMBOLS[currency];
    return `${symbol}${amount.toFixed(2)}`;
};

// Conversión entre monedas usando tipo de cambio
export const convertCurrency = (
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    exchangeRate: number
): number => {
    if (fromCurrency === toCurrency) return amount;

    // Si estamos convirtiendo de USD a ARS
    if (fromCurrency === 'USD' && toCurrency === 'ARS') {
        return amount * exchangeRate;
    }

    // Si estamos convirtiendo de ARS a USD
    if (fromCurrency === 'ARS' && toCurrency === 'USD') {
        return amount / exchangeRate;
    }

    return amount;
};

// Obtener último tipo de cambio guardado
export const getLastExchangeRate = (
    fromCurrency: Currency,
    toCurrency: Currency,
    exchangeRates: ExchangeRate[]
): ExchangeRate | null => {
    if (fromCurrency === toCurrency) return null;

    const rates = exchangeRates.filter(
        r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return rates.length > 0 ? rates[0] : null;
};

// Crear un nuevo tipo de cambio
export const createExchangeRate = (
    fromCurrency: Currency,
    toCurrency: Currency,
    rate: number,
    source: string = 'Manual'
): ExchangeRate => {
    return {
        id: crypto.randomUUID(),
        fromCurrency,
        toCurrency,
        rate,
        date: new Date(),
        source
    };
};

// Validar que no se mezclen monedas sin conversión
export const validateCurrencyMix = (currencies: Currency[]): boolean => {
    const uniqueCurrencies = [...new Set(currencies)];
    return uniqueCurrencies.length <= 1;
};

// Convertir un array de montos a la moneda base
export const convertToBaseCurrency = (
    amounts: CurrencyAmount[],
    exchangeRates: ExchangeRate[]
): number => {
    let total = 0;

    for (const { amount, currency } of amounts) {
        if (currency === BASE_CURRENCY) {
            total += amount;
        } else {
            const rate = getLastExchangeRate(currency, BASE_CURRENCY, exchangeRates);
            if (rate) {
                total += convertCurrency(amount, currency, BASE_CURRENCY, rate.rate);
            } else {
                console.warn(`No exchange rate found for ${currency} to ${BASE_CURRENCY}`);
                total += amount; // Fallback: sumar sin convertir
            }
        }
    }

    return total;
};
