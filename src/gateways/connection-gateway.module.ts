import { Global, Module } from "@nestjs/common";
import { ConnectionGateway } from "./connection.gateway";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "src/users/users.module";

// Created gateway.module so as to export it globally or to other services
@Global()
@Module({
    imports: [ConfigModule, JwtModule, UsersModule],
    providers: [ConnectionGateway],
    exports: [ConnectionGateway],
})

export class ConnectionGatewayModule {}