/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs';

@Injectable()
export class TileserverManagerService implements OnApplicationShutdown {
  private readonly logger = new Logger(TileserverManagerService.name);
  private tileserverProcess: ChildProcess | null = null;
  private tilesPath = join(process.cwd(), 'uploads', 'mbtiles');
  private configPath = join(process.cwd(), 'uploads', 'tileserver-config');
  private port = 8080;

  onApplicationShutdown() {
    this.stopTileserver();
  }

  private generateConfig() {
    if (!existsSync(this.tilesPath)) {
      mkdirSync(this.tilesPath, { recursive: true });
    }

    const files = readdirSync(this.tilesPath).filter((f) =>
      f.endsWith('.mbtiles'),
    );

    if (files.length === 0) {
      this.logger.warn('No mbtiles files found to serve.');
      return null;
    }

    if (!existsSync(this.configPath))
      mkdirSync(this.configPath, { recursive: true });

    const config: any = {
      options: { serveAllFonts: true },
      styles: {},
      data: {},
    };

    files.forEach((file) => {
      const name = file.replace('.mbtiles', '');
      config.data[name] = {
        mbtiles: join(this.tilesPath, file).replace(/\\/g, '/'),
      };
    });

    const configFilePath = join(this.configPath, 'config.json');
    writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    this.logger.log(`Config generated with ${files.length} tiles.`);
    return configFilePath;
  }

  startTileserver() {
    if (this.tileserverProcess) this.stopTileserver();

    const configFilePath = this.generateConfig();
    if (!configFilePath) return;

    this.logger.log('🚀 Starting tileserver-gl-light...');

    this.tileserverProcess = spawn(
      'tileserver-gl-light', // Используем глобальную команду (установлена в Dockerfile)
      [
        this.tilesPath.replace(/\\/g, '/'),
        '--config',
        configFilePath.replace(/\\/g, '/'),
        '--port',
        `${this.port}`,
      ],
      { stdio: 'inherit', shell: true },
    );

    this.tileserverProcess.on('exit', (code) => {
      this.logger.warn(`Tileserver exited with code ${code}`);
      this.tileserverProcess = null;
    });
  }

  stopTileserver() {
    if (this.tileserverProcess) {
      this.logger.log('🛑 Stopping tileserver-gl-light...');
      // В Unix-системах (Docker) для убийства процесса, запущенного через shell,
      // иногда нужно убить группу процессов, но .kill() обычно достаточно для спавна
      this.tileserverProcess.kill();
      this.tileserverProcess = null;
    }
  }

  restartTileserver() {
    this.startTileserver();
  }
}
