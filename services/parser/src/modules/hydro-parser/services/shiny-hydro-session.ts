import { BadRequestException, Logger } from '@nestjs/common';

interface ShinyMessage {
  config?: { sessionId: string; workerId: string };
  values?: {
    map?: unknown;
    plot?: unknown;
  };
  errors?: Record<string, unknown>;
  busy?: 'busy' | 'idle';
}

export class ShinyHydroSession {
  private socket: WebSocket | null = null;
  private clientSeq = 0;
  private mapValue: unknown = null;
  private plotReady = false;
  private session?: { sessionId: string; workerId: string };
  private listeners: Array<(message: ShinyMessage) => void> = [];

  constructor(
    private readonly logger: Logger,
    private readonly daterange: [string, string] = [
      `${new Date().getFullYear()}-01-01`,
      new Date().toISOString().slice(0, 10),
    ],
  ) {}

  get sessionId() {
    if (!this.session?.sessionId) {
      throw new BadRequestException('Shiny session was not initialized');
    }
    return this.session.sessionId;
  }

  async connect() {
    const token = Math.random().toString(36).slice(2);
    const server = Math.floor(Math.random() * 1000);
    const session = Math.random().toString(36).slice(2);
    const url = `ws://ecodata.kz:3838/app_dg_map_ru/__sockjs__/n=${token}/${server}/${session}/websocket`;

    this.socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject(new Error('Socket was not created'));
      const timer = setTimeout(
        () => reject(new Error('ecodata timeout')),
        30000,
      );
      this.socket.onmessage = (event) => {
        const raw = String(event.data);
        if (raw === 'o') {
          this.sendRobust('o', '');
          this.sendRobust('m', JSON.stringify(this.createInitPayload()));
          clearTimeout(timer);
          resolve();
          return;
        }
        this.handleRawMessage(raw);
      };
      this.socket.onerror = () => reject(new Error('ecodata websocket error'));
    });

    return this;
  }

  async waitForMap(): Promise<unknown> {
    if (this.mapValue) return this.mapValue;
    return this.waitFor((message) => {
      if (message.values?.map) {
        this.mapValue = message.values.map;
        return this.mapValue;
      }
      return null;
    }, 45000);
  }

  async waitForPlot() {
    if (this.plotReady) return true;
    return this.waitFor((message) => {
      if (message.values?.plot || (message.errors && !message.errors.plot)) {
        this.plotReady = true;
        return true;
      }
      return null;
    }, 45000);
  }

  sendUpdate(data: Record<string, unknown>) {
    this.sendRobust('m', JSON.stringify({ method: 'update', data }));
  }

  close() {
    this.socket?.close();
  }

  private waitFor<T>(
    selector: (message: ShinyMessage) => T | null,
    timeoutMs: number,
  ) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners = this.listeners.filter((item) => item !== listener);
        reject(new BadRequestException('ecodata did not answer in time'));
      }, timeoutMs);
      const listener = (message: ShinyMessage) => {
        const selected = selector(message);
        if (selected) {
          clearTimeout(timer);
          this.listeners = this.listeners.filter((item) => item !== listener);
          resolve(selected);
        }
      };
      this.listeners.push(listener);
    });
  }

  private handleRawMessage(raw: string) {
    if (!raw.startsWith('a')) return;
    const frames = JSON.parse(raw.slice(1)) as string[];
    for (const frame of frames) {
      const id = frame.match(/^([0-9A-F]+)#/)?.[1];
      if (id) this.sendAck(id);

      const body = frame.split('|').slice(2).join('|');
      if (!body || body === 'ACK') continue;
      try {
        const message = JSON.parse(body) as ShinyMessage;
        if (message.config) this.session = message.config;
        if (message.values?.map) this.mapValue = message.values.map;
        if (message.values?.plot) this.plotReady = true;
        this.listeners.forEach((listener) => listener(message));
      } catch (error) {
        this.logger.debug(`Не удалось разобрать Shiny frame: ${String(error)}`);
      }
    }
  }

  private sendRobust(type: 'o' | 'm', payload: string) {
    const id = (this.clientSeq++).toString(16).toUpperCase();
    this.socket?.send(JSON.stringify([`${id}#0|${type}|${payload}`]));
  }

  private sendAck(id: string) {
    this.socket?.send(JSON.stringify([`ACK ${id}`]));
  }

  private createInitPayload() {
    return {
      method: 'init',
      data: {
        nav: 'Гидрологический мониторинг',
        value: 'level',
        year: String(new Date().getFullYear()),
        year_forecast: String(new Date().getFullYear()),
        year_pr: 'Предварительный',
        region: 'Акмолинская область',
        'daterange:shiny.date': this.daterange,
        '.clientdata_output_map_width': 696,
        '.clientdata_output_map_height': 750,
        '.clientdata_output_plot_width': 696,
        '.clientdata_output_plot_height': 600,
        '.clientdata_output_plot_bg': 'rgb(255, 255, 255)',
        '.clientdata_output_plot_fg': 'rgb(85, 85, 85)',
        '.clientdata_output_plot_accent': 'rgb(47, 164, 231)',
        '.clientdata_output_plot_font': {
          families: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
          size: '14px',
        },
        '.clientdata_output_map_hidden': false,
        '.clientdata_output_downloadData_hidden': false,
        '.clientdata_output_plot_hidden': false,
        '.clientdata_output_image1_hidden': true,
        '.clientdata_output_autumnpdf2_hidden': true,
        '.clientdata_output_autumnpdf3_hidden': true,
        '.clientdata_output_glubpdf4_hidden': true,
        '.clientdata_output_glubpdf5_hidden': true,
        '.clientdata_output_map_pr_hidden': true,
        '.clientdata_output_group5_hidden': true,
        '.clientdata_output_group6_hidden': true,
        '.clientdata_pixelratio': 1,
        '.clientdata_url_protocol': 'http:',
        '.clientdata_url_hostname': 'ecodata.kz',
        '.clientdata_url_port': '3838',
        '.clientdata_url_pathname': '/app_dg_map_ru/',
        '.clientdata_url_search': '',
        '.clientdata_url_hash_initial': '',
        '.clientdata_url_hash': '',
        '.clientdata_singletons': '',
      },
    };
  }
}
