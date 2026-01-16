/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class TileserverManagerService implements OnModuleInit, OnApplicationShutdown {
    private tileserverProcess: ChildProcess | null = null;
    private tilesPath = join(process.cwd(), 'uploads', 'mbtiles'); // папка с mbtiles
    private configPath = join(process.cwd(), 'uploads', 'tileserver-config'); // отдельная папка для config
    private port = 8080;

    onModuleInit() {
        this.startTileserver();
    }

    onApplicationShutdown() {
        this.stopTileserver();
    }

    // Генерируем config.json с ссылкой на все mbtiles
    private generateConfig() {
        // 📦 Пути берём из переменных окружения или по умолчанию
        const uploadsPath = process.env.UPLOADS_PATH || join(__dirname, '..', '..', 'uploads');
        const mbtilesPath = join(uploadsPath, 'mbtiles');
        const configPath = process.env.TILESERVER_CONFIG_PATH || join(uploadsPath, 'tileserver-config');

        // ✅ Проверяем, что папка с mbtiles существует
        if (!existsSync(mbtilesPath)) {
            console.error('❌ Папка с mbtiles не найдена:', mbtilesPath);
            return;
        }

        const files = readdirSync(mbtilesPath).filter(f => f.endsWith('.mbtiles'));
        if (files.length === 0) {
            console.error('❌ В папке нет файлов .mbtiles:', mbtilesPath);
            return;
        }

        // ✅ Создаём папку для конфига, если не существует
        if (!existsSync(configPath)) mkdirSync(configPath, { recursive: true });

        // 🧩 Формируем config.json
        const config: any = {
            options: { serveAllFonts: true },
            styles: {},
            data: {},
        };

        files.forEach(file => {
            const name = file.replace('.mbtiles', '');
            config.data[name] = { mbtiles: join(mbtilesPath, file).replace(/\\/g, '/') };
        });

        const configFilePath = join(configPath, 'config.json');
        writeFileSync(configFilePath, JSON.stringify(config, null, 2));
        console.log('✅ config.json создан с файлами:', files);
        return configFilePath;
    }

    startTileserver() {
        if (this.tileserverProcess) this.stopTileserver();

        const configFilePath = this.generateConfig();
        if (!configFilePath) return;

        console.log('🚀 Starting tileserver-gl-light...');

        // Запускаем tileserver на папке с mbtiles с указанием конфигурации
        this.tileserverProcess = spawn(
            'npx',
            ['tileserver-gl-light', this.tilesPath.replace(/\\/g, '/'), '--config', configFilePath.replace(/\\/g, '/'), '--port', `${this.port}`],
            { stdio: 'inherit', shell: true }
        );

        this.tileserverProcess.on('exit', (code) => {
            console.log(`Tileserver exited with code ${code}`);
            this.tileserverProcess = null;
        });
    }

    stopTileserver() {
        if (this.tileserverProcess) {
            console.log('🛑 Stopping tileserver-gl-light...');
            this.tileserverProcess.kill();
            this.tileserverProcess = null;
        }
    }

    restartTileserver() {
        this.startTileserver();
    }
}
