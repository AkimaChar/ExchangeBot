import { Sequelize, DataTypes, Model } from "sequelize";

const sequelize = new Sequelize("botcript", "postgres", "postgres", {
  host: process.env.DB_HOST || "localhost",
  port: "5432",
  dialect: "postgres",
  freezeTableName: true,
});
try {
  await sequelize.authenticate();
  console.log("Соединение с БД было успешно установлено");
} catch (e) {
  console.log("Невозможно выполнить подключение к БД: ", e);
}

class User extends Model {}
User.init(
  {
    userID: {
      type: DataTypes.INTEGER,
      allowNull: null,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: null,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: null,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: null,
    },
  },
  {
    sequelize, // Экземпляр подключения (обязательно)
    modelName: "User",
    timestamps: false,
  }
);
await User.sync({ alter: true });

export default User;
