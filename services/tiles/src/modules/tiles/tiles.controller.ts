/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, UseInterceptors, UploadedFiles, Get, Body } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { TilesService } from './tiles.service';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { TileserverManagerService } from './tileserver.manager';

@Controller('tiles')
export class TilesController {
    constructor(
        private readonly tilesService: TilesService,
        private readonly tileserverManager: TileserverManagerService,
    ) { }

    @Post('upload')
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'geo', maxCount: 1 },
                { name: 'mbtiles', maxCount: 1 },
            ],
            {
                storage: diskStorage({

                    destination: (req, file, cb) => {
                        const baseDir = process.env.UPLOADS_PATH || join(__dirname, '..', '..', 'uploads');

                        const geoDir = join(baseDir, 'geo');
                        const mbDir = join(baseDir, 'mbtiles');

                        // Создаём папки, если не существует
                        [geoDir, mbDir].forEach(dir => {
                            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
                        });

                        if (file.fieldname === 'geo') cb(null, geoDir);
                        else if (file.fieldname === 'mbtiles') cb(null, mbDir);
                        else cb(new Error('Unknown fieldname'), '');
                    },
                    filename: (req, file, cb) => {
                        if (!req.body.tileUUID) req.body.tileUUID = uuidv4();
                        const id = req.body.tileUUID;

                        const ext = file.fieldname;
                        cb(null, `${id}.${ext}`);
                    },
                }),
            },
        ),
    )
    async upload(
        @UploadedFiles() files: { geo?: Express.Multer.File[]; mbtiles?: Express.Multer.File[] },
        @Body() body: any,
    ) {

        const {
            name,
            type,
            colorMode,
            selectedVariable,
            solidColor,
            gradientColorA,
            gradientColorB,
        } = body;

        const id = (files.geo?.[0]?.filename || files.mbtiles?.[0]?.filename)?.split('.')[0] || uuidv4();
        const geoFile = files.geo?.[0]?.path;
        const mbtilesFile = files.mbtiles?.[0]?.path;

        if (!geoFile || !mbtilesFile) {
            throw new Error('Both geo and mbtiles files must be uploaded');
        }

        const tile = await this.tilesService.saveTile({
            id,
            name,
            type,
            geoPath: geoFile,
            mbtilesPath: mbtilesFile,
            colorMode,
            selectedVariable,
            solidColor,
            gradientColorA,
            gradientColorB,
        });

        this.tileserverManager.restartTileserver();

        return tile;
    }

    @Get()
    async getAll() {
        return {
            statusCode: 200,
            data: await this.tilesService.getAllTiles(),
        };
    }

}
