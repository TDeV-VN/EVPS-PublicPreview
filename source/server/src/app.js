const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
import APIs_v1 from "./routes/v1/index.js";
import { errorHandlingMiddleware } from "./middlewares/errorHandlingMiddleware.js";
import { responseFormatMiddleware } from "./middlewares/responseFormatMiddleware.js";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import ApiError from "./utils/ApiError.js";
import { bullBoardRouter } from "./routes/bullBoard.js";
import { setRequestId } from "./middlewares/requestIdMiddleware.js";

const app = express();

app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(setRequestId);
app.use(responseFormatMiddleware);
app.use("/v1", APIs_v1);

// TODO: UI reset password
app.get("/reset.html", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../reset.html"));
});

// Trực quan hóa và quản lý các job queue
app.use("/admin/queues", bullBoardRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(new ApiError(404, "Not Found"));
});

app.use(errorHandlingMiddleware);

module.exports = app;
