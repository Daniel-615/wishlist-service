const express = require('express');
const CartController = require('../controllers/cart.controller');

class CartRoute {
  constructor(app) {
    this.router = express.Router();
    this.controller = new CartController();
    this.registerRoutes();
    app.use("/cart-wishlist-service/cart", this.router);
  }

  registerRoutes() {
    /**
     * @openapi
     * tags:
     *   - name: Cart
     *     description: Gestión del carrito de compras por usuario
     */

    /**
     * @openapi
     * /cart/clear/{user_id}:
     *   delete:
     *     summary: Vaciar el carrito de un usuario
     *     tags: [Cart]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string", example: "a0f1a0b2-1c2d-3e4f-5a6b-7c8d9e0f" }
     *     responses:
     *       200:
     *         description: Carrito vaciado
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 success: { type: "boolean", example: true }
     *                 data:
     *                   type: "object"
     *                   properties:
     *                     deleted: { type: "integer", example: 3 }
     *                 message: { type: "string", example: "3 producto(s) eliminado(s) del carrito." }
     */
    this.router.delete("/clear/:user_id", (req, res) => {
      this.controller.clearCart(req, res);
    });

    /**
     * @openapi
     * /cart:
     *   post:
     *     summary: Agregar producto al carrito (o incrementar cantidad si ya existe)
     *     tags: [Cart]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AddToCartDto'
     *     responses:
     *       201:
     *         description: Producto agregado
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/CartItemResponse' }
     */
    this.router.post("/", (req, res) => {
      this.controller.addToCart(req, res);
    });

    /**
     * @openapi
     * /cart/{user_id}:
     *   get:
     *     summary: Obtener el carrito de un usuario
     *     tags: [Cart]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string", example: "a0f1a0b2-1c2d-3e4f-5a6b-7c8d9e0f" }
     *     responses:
     *       200:
     *         description: Carrito obtenido
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 success: { type: "boolean", example: true }
     *                 message: { type: "string", example: "Carrito obtenido." }
     *                 data:
     *                   type: "array"
     *                   items: { $ref: '#/components/schemas/CartItemEnriched' }
     */
    this.router.get("/:user_id", (req, res) => {
      this.controller.getCartByUser(req, res);
    });

    /**
     * @openapi
     * /cart/{user_id}/{producto_talla_color_id}:
     *   put:
     *     summary: Actualizar cantidad de un producto en el carrito
     *     tags: [Cart]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string" }
     *       - in: path
     *         name: producto_talla_color_id
     *         required: true
     *         schema: { type: "integer", example: 123 }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: "object"
     *             properties:
     *               cantidad: { type: "integer", minimum: 1, example: 3 }
     *     responses:
     *       200:
     *         description: Cantidad actualizada
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/CartItemResponse' }
     */
    this.router.put("/:user_id/:producto_talla_color_id", (req, res) => {
      this.controller.updateCartItem(req, res);
    });

    /**
     * @openapi
     * /cart/{user_id}/{producto_talla_color_id}:
     *   delete:
     *     summary: Eliminar un producto del carrito
     *     tags: [Cart]
     *     parameters:
     *       - in: path
     *         name: user_id
     *         required: true
     *         schema: { type: "string" }
     *       - in: path
     *         name: producto_talla_color_id
     *         required: true
     *         schema: { type: "integer", example: 123 }
     *     responses:
     *       200:
     *         description: Producto eliminado
     *         content:
     *           application/json:
     *             schema:
     *               type: "object"
     *               properties:
     *                 success: { type: "boolean", example: true }
     *                 message: { type: "string", example: "Producto eliminado del carrito." }
     */
    this.router.delete("/:user_id/:producto_talla_color_id", (req, res) => {
      this.controller.removeFromCart(req, res);
    });
  }
}

module.exports = CartRoute;
