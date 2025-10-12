const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { PORT,API_GATEWAY_URL } = require('./src/config/config.js')
const db = require('./src/models'); 
const CartRoute= require('./src/routes/cart.route.js')
const WishlistRoute= require('./src/routes/wishlist.route.js')
class Server {
  constructor() {
    this.app = express();
    this.port = PORT;
    this.app.use(express.json()); // Middleware para parsear JSON
    this.configureMiddlewares();
    this.configureRoutes();
    this.connectDatabase();
  }

  configureMiddlewares() {
    this.app.use(cors({
      origin: API_GATEWAY_URL,
      credentials: true // Permitir cookies y credenciales
    }));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  configureRoutes() {
    new CartRoute(this.app)
    new WishlistRoute(this.app)
  }

  async connectDatabase() {
    try {
      await db.sequelize.sync({alter:true}); // o sync({ force: true }) si estás en desarrollo
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
    });
  }
}

const server = new Server();
server.start();
