interface ProbeRequest {
  target: string;
  ports: number[];
}

export interface PortResult {
  port: number;
  status: "open" | "closed" | "filtered";
  service: string;
  latencyMs: number;
  banner: string | null;
}
