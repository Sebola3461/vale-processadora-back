import { config } from "dotenv";
import { ApiServer } from "./src/ApiServer";
config();

ApiServer.Initialize();
