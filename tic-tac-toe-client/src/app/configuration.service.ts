import { Injectable } from '@angular/core';
import * as config from '../assets/config.json';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private socketUrl = 'ws://localhost:8999';
  constructor() { }

  getSocketUrl(): string {
    if (config.socketUrl) {
      this.socketUrl = config.socketUrl;
    }
    return this.socketUrl;
  }

  isSingleClient(): boolean {
    return config.singleClient ? config.singleClient : false;
  }
}
