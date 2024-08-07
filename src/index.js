import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: `./env`,
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 6000, () => {
      console.log(`App is running successfully on PORT ${process.env.PORT}`);
      app.on(error, () => {
        console.log("App is not running", error);
      });
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed !! ", err);
  });
