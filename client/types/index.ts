export interface Index {
  Ticker: string;
  Name: string;
  Close: number;
  Change: number;
  Open: number;
  High: number;
  Low: number;
  Volume: number;
  "Adj Close": number;
}

// Chart types
export interface ChartData {
  Date: string;
  Close: number;
  "Adj Close": number;
}

export interface ChartOptions {
  responsive: boolean;
  plugins: {
    legend: {
      display: boolean;
    };
    title: {
      display: boolean;
      text: string;
    };
    tooltip: {
      mode: string;
      intersect: boolean;
      callbacks: {
        label: (context: unknown) => string;
      };
    };
  };
  hover: {
    mode: string;
    intersect: boolean;
  };
  scales: {
    x: {
      title: {
        display: boolean;
        text: string;
      };
    };
    y: {
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}