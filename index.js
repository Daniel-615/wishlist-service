const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const { PORT, API_GATEWAY_URL } = require('./src/config/config.js');
const db = require('./src/models');

const swaggerJsdoc = require('swagger-jsdoc');
const { apiReference } = require('@scalar/express-api-reference');

const CartRoute = require('./src/routes/cart.route.js');
const WishlistRoute = require('./src/routes/wishlist.route.js');

class Server {
  constructor() {
    this.app = express();
    this.port = PORT;

    // Middlewares básicos
    this.app.use(cookieParser());
    this.app.use(express.json());
    this.configureMiddlewares();

    // OpenAPI / Scalar
    this.configureOpenAPI();

    // Rutas de negocio
    this.configureRoutes();

    // DB
    this.connectDatabase();
  }

  configureMiddlewares() {
    this.app.use(cors({
      origin: API_GATEWAY_URL,
      credentials: true,
      methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Set-Cookie']
    }));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  configureOpenAPI() {
    const openapiDefinition = {
      openapi: '3.0.3',
      info: {
        title: 'Cart & Wishlist Service',
        version: '1.0.0',
        description: 'API de carrito y wishlist (con enlaces compartidos y recordatorios).',
      },
      servers: [{ url: `http://localhost:${this.port}/cart-wishlist-service` }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
        },
        schemas: {
          CartItem: {
            type: 'object',
            properties: {
              user_id: { type: 'string', example: 'a0f1a0b2-1c2d-3e4f-5a6b-7c8d9e0f' },
              producto_talla_color_id: { type: 'integer', example: 123 },
              cantidad: { type: 'integer', example: 2 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          AddToCartDto: {
            type: 'object',
            required: ['user_id', 'producto_talla_color_id', 'cantidad'],
            properties: {
              user_id: { type: 'string', example: 'a0f1a0b2-1c2d-3e4f-5a6b-7c8d9e0f' },
              producto_talla_color_id: { type: 'integer', example: 123 },
              cantidad: { type: 'integer', minimum: 1, example: 1 }
            }
          },
          CartItemResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Producto agregado al carrito.' },
              data: { $ref: '#/components/schemas/CartItem' }
            }
          },
          CartItemEnriched: {
            type: 'object',
            properties: {
              user_id: { type: 'string' },
              producto_talla_color_id: { type: 'integer' },
              cantidad: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              producto: { type: 'object', nullable: true, description: 'Payload del PRODUCT_SERVICE' },
              error: { type: 'string', nullable: true, example: 'Producto no encontrado' }
            }
          },
          WishlistItem: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 42 },
              user_id: { type: 'string', example: 'a0f1a0b2-1c2d-3e4f-5a6b-7c8d9e0f' },
              producto_talla_color_id: { type: 'integer', example: 123 },
              is_shared: { type: 'boolean', example: false },
              share_id: { type: 'string', nullable: true, example: 'WL-abc123xyz' },
              share_expires_at: { type: 'string', format: 'date-time', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          },
          AddToWishlistDto: {
            type: 'object',
            required: ['user_id','producto_talla_color_id'],
            properties: {
              user_id: { type: 'string' },
              producto_talla_color_id: { type: 'integer' }
            }
          },
          WishlistEnrichedItem: {
            type: 'object',
            properties: {
              producto: { type: 'object', nullable: true, description: 'Payload del PRODUCT_SERVICE' },
              producto_talla_color_id: { type: 'integer', nullable: true },
              error: { type: 'string', nullable: true }
            }
          },
          ShareLinkRequest: {
            type: 'object',
            properties: {
              expiresInHours: { type: 'integer', default: 72, minimum: 1, example: 72 },
              forceRefresh: { type: 'boolean', default: false }
            }
          },
          ShareLinkResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              shareId: { type: 'string', example: 'WL-abc123xyz' },
              url: { type: 'string', example: 'https://tu-frontend.com/wishlist/shared/WL-abc123xyz' },
              expiresAt: { type: 'string', format: 'date-time' }
            }
          },
          SharedWishlistResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  shareId: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        producto_talla_color_id: { type: 'integer' },
                        producto: {
                          type: 'object',
                          nullable: true,
                          properties: {
                            nombre: { type: 'string', example: 'Playera Tech' },
                            precio: { type: 'number', format: 'float', nullable: true },
                            imagen: { type: 'string', nullable: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          ErrorResponse: {
            type: 'object',
            properties: { message: { type: 'string', example: 'Descripción del error.' } }
          }
        }
      }
    };

    const openapi = swaggerJsdoc({
      definition: openapiDefinition,
      apis: [
        './src/routes/**/*.js',
        './src/routes/*.js',
      ],
    });

    // Spec JSON (no cache para evitar stale)
    this.app.get('/openapi.json', (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.json(openapi);
    });

    // UI Scalar — configuración mínima VÁLIDA
    this.app.use('/docs', apiReference({
      spec: { url: '/openapi.json' }
      // No pasar theme, layout, defaultHttpClient, etc.
    }));
  }

  configureRoutes() {
    new CartRoute(this.app);
    new WishlistRoute(this.app);
  }

  async connectDatabase() {
    try {
      await db.sequelize.sync({ alter: true });
      console.log('Base de datos conectada y sincronizada.');
      const tables = await db.sequelize.getQueryInterface().showAllTables();
      console.log('Tablas en la base de datos:', tables);
    } catch (error) {
      console.error('Error al conectar con la base de datos:', error);
    }
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto ${this.port}`);
      console.log(`Docs:  http://localhost:${this.port}/docs`);
      console.log(`Spec:  http://localhost:${this.port}/openapi.json`);
    });
  }
}

const server = new Server();
server.start();
