import axios, { type AxiosInstance } from 'axios';

type Headers = Record<string, string>;

class AxiosDomain {
  constructor(private readonly baseURL: string, private readonly headers: Headers) {}

  initInstance(): AxiosInstance {
    return axios.create({ baseURL: this.baseURL, headers: this.headers, timeout: 15_000 });
  }
}

export class AxiosBuilder {
  private baseURL = '';
  private headers: Headers = {};

  static build() { return new AxiosBuilder(); }
  withUrl(url: string) { this.baseURL = url; return this; }
  withDefaultHeader() { this.headers = { 'Content-Type': 'application/json' }; return this; }
  withHeaders(headers: Headers) { this.headers = { ...headers }; return this; }
  toDomain() { return new AxiosDomain(this.baseURL, this.headers); }
}
