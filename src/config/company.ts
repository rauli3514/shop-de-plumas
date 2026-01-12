// Configuración centralizada de los datos de la empresa
export const COMPANY_INFO = {
    name: "Shop de Plumas",
    legalName: "Shop de Plumas by Lila",
    address: "Chubut 740",
    city: "Fontana",
    province: "Chaco",
    phone: "3624-608980",
    email: "@shop_plumas",
    cuit: "",
    website: "instagram.com/shop_plumas",
    // Usamos BASE_URL para que funcione tanto en local como en GitHub Pages (/shop-de-plumas/)
    logoUrl: `${import.meta.env.BASE_URL}logo.png`,
    logoDarkUrl: `${import.meta.env.BASE_URL}logo-dark-circle-v2.jpg`,
    logoLightUrl: `${import.meta.env.BASE_URL}logo-light-circle-v2.jpg`,

    // Textos para headers/footers
    receiptHeader: "Indumentaria y Accesorios",
    pdfFooter: "Shop de Plumas - Gracias por tu compra",
};
