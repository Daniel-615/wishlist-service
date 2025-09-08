const { Model, DataTypes } = require('sequelize');

class Wishlist extends Model {}

module.exports = (sequelize) => {
  Wishlist.init(
    {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      producto_talla_color_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      share_id:{
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      share_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_shared:{
        type:DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'wishlist',
      tableName: 'wishlists',
      timestamps: true,
    }
  );
  return Wishlist;
};
