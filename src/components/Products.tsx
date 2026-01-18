import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Search, QrCode } from 'lucide-react';
import type { Product } from '../types';
import ProductModal from './ProductModal';
import QRModal from './QRModal';
import './Products.css';

const Products: React.FC = () => {
    const { products, deleteProduct, currentUser } = useApp();
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProductQR, setSelectedProductQR] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isOwner = currentUser?.role === 'owner';

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsProductModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            deleteProduct(id);
        }
    };

    const handleShowQR = (product: Product) => {
        setSelectedProductQR(product);
        setIsQRModalOpen(true);
    };

    const handleCloseProductModal = () => {
        setIsProductModalOpen(false);
        setEditingProduct(null);
    };

    const handleCloseQRModal = () => {
        setIsQRModalOpen(false);
        setSelectedProductQR(null);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="products">
            <div className="products-header">
                <h2>Inventario de Productos</h2>
                {isOwner && (
                    <button className="btn btn-primary" onClick={() => setIsProductModalOpen(true)}>
                        <Plus size={20} />
                        Nuevo Producto
                    </button>
                )}
            </div>

            <div className="search-bar">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Color</th>
                            <th>Medida</th>
                            <th>Estado</th>
                            <th>Precio Venta</th>
                            {isOwner && <th>Costo</th>}
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td className="font-mono">{product.code}</td>
                                <td>{product.name}</td>
                                <td>{product.color}</td>
                                <td>{product.size || '-'}</td>
                                <td>
                                    {product.status === 'in_stock' && <span className="badge badge-success">En Stock</span>}
                                    {product.status === 'incoming' && <span className="badge badge-warning">En Camino</span>}
                                    {product.status === 'reserved' && <span className="badge badge-info">Reservado</span>}
                                </td>
                                <td className="font-bold">${product.price}</td>
                                {isOwner && <td>${product.cost}</td>}
                                <td className={product.stock <= product.minStock ? 'text-error font-bold' : ''}>
                                    {product.stock}
                                </td>
                                <td>
                                    <div className="actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleShowQR(product)}
                                            title="Ver QR"
                                        >
                                            <QrCode size={18} />
                                        </button>

                                        {isOwner && (
                                            <>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => handleEdit(product)}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-icon-danger"
                                                    onClick={() => handleDelete(product.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={isOwner ? 7 : 6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No se encontraron productos
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isProductModalOpen && (
                <ProductModal
                    product={editingProduct}
                    onClose={handleCloseProductModal}
                />
            )}

            {isQRModalOpen && selectedProductQR && (
                <QRModal
                    product={selectedProductQR}
                    onClose={handleCloseQRModal}
                />
            )}
        </div>
    );
};

export default Products;
