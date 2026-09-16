export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
  timestamp?: number;
}

export class ChartEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: Candle[] = [];
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  setData(data: Candle[]) {
    this.data = data;
    this.draw();
  }

  updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }

  draw(options: { 
    showRSI?: boolean, 
    showMACD?: boolean, 
    rsiData?: number[], 
    macdData?: { macdLine: number[], signalLine: number[], histogram: number[] },
    trendlines?: { start: number, end: number }[],
    patterns?: { index: number, type: string }[],
    colors?: { candleUp?: string, candleDown?: string, wickUp?: string, wickDown?: string }
  } = {}) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (!this.data.length) return;

    // Define Pane Heights
    const indicatorPaneHeight = 80;
    let mainChartHeight = this.height;
    if (options.showRSI) mainChartHeight -= indicatorPaneHeight;
    if (options.showMACD) mainChartHeight -= indicatorPaneHeight;

    const max = Math.max(...this.data.map(d => d.high));
    const min = Math.min(...this.data.map(d => d.low));
    const priceRange = max - min;
    const padding = priceRange * 0.1;
    const displayMax = max + padding;
    const displayMin = min - padding;
    const displayRange = displayMax - displayMin;

    const scaleY = mainChartHeight / displayRange;
    const candleWidth = this.width / this.data.length;

    // 1. Draw Main Chart Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    for(let i = 1; i < 5; i++) {
      const y = (mainChartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // 2. Draw Trendlines (if provided)
    if (options.trendlines) {
      ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      options.trendlines.forEach(line => {
        const x1 = line.start * candleWidth + candleWidth/2;
        const y1 = mainChartHeight - (this.data[line.start].low - displayMin) * scaleY;
        const x2 = line.end * candleWidth + candleWidth/2;
        const y2 = mainChartHeight - (this.data[line.end].low - displayMin) * scaleY;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    // 3. Draw Candles
    this.data.forEach((candle, i) => {
      const x = i * candleWidth;
      const openY = mainChartHeight - (candle.open - displayMin) * scaleY;
      const closeY = mainChartHeight - (candle.close - displayMin) * scaleY;
      const highY = mainChartHeight - (candle.high - displayMin) * scaleY;
      const lowY = mainChartHeight - (candle.low - displayMin) * scaleY;

      const upColor = options.colors?.candleUp || "#00ff66";
      const downColor = options.colors?.candleDown || "#ff1744";
      const wickUpolor = options.colors?.wickUp || "#80ffb0";
      const wickDownColor = options.colors?.wickDown || "#ff8a80";

      ctx.strokeStyle = candle.close >= candle.open ? wickUpolor : wickDownColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      ctx.fillStyle = candle.close >= candle.open ? upColor : downColor;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(openY - closeY), 1);
      ctx.fillRect(x + 1, bodyTop, Math.max(candleWidth - 2, 1), bodyHeight);
    });

    // 4. Draw Patterns (if provided)
    if (options.patterns) {
      options.patterns.forEach(p => {
        const x = p.index * candleWidth + candleWidth/2;
        const y = mainChartHeight - (this.data[p.index].high - displayMin) * scaleY;
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(x, y - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "8px monospace";
        ctx.fillText(p.type, x + 5, y - 10);
      });
    }

    let currentY = mainChartHeight;

    // 5. Draw RSI Pane
    if (options.showRSI && options.rsiData) {
      ctx.save();
      ctx.translate(0, currentY);
      
      // RSI Background
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, this.width, indicatorPaneHeight);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(0, 0, this.width, indicatorPaneHeight);

      // RSI Overbought/Oversold Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.setLineDash([2, 4]);
      [30, 70].forEach(level => {
        const y = indicatorPaneHeight - (level / 100) * indicatorPaneHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // RSI Line
      ctx.strokeStyle = "#A855F7"; // Purple
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      options.rsiData.forEach((val, i) => {
        const x = i * candleWidth + candleWidth/2;
        const y = indicatorPaneHeight - (val / 100) * indicatorPaneHeight;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      
      ctx.fillStyle = "#A855F7";
      ctx.font = "bold 9px monospace";
      ctx.fillText("RSI (14)", 10, 15);
      
      ctx.restore();
      currentY += indicatorPaneHeight;
    }

    // 6. Draw MACD Pane
    if (options.showMACD && options.macdData) {
      ctx.save();
      ctx.translate(0, currentY);

      // MACD Background
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, this.width, indicatorPaneHeight);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(0, 0, this.width, indicatorPaneHeight);

      const allVals = [...options.macdData.macdLine, ...options.macdData.signalLine, ...options.macdData.histogram];
      const maxM = Math.max(...allVals);
      const minM = Math.min(...allVals);
      const rangeM = Math.max(Math.abs(maxM), Math.abs(minM)) * 2 || 1;
      const midM = indicatorPaneHeight / 2;
      const scaleM = indicatorPaneHeight / rangeM;

      // Histogram
      options.macdData.histogram.forEach((v, i) => {
        const x = i * candleWidth + 1;
        const h = v * scaleM;
        ctx.fillStyle = v > 0 ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";
        ctx.fillRect(x, midM - h, Math.max(candleWidth - 2, 1), h);
      });

      // MACD Line
      ctx.strokeStyle = "#00FFFF";
      ctx.beginPath();
      options.macdData.macdLine.forEach((v, i) => {
        const x = i * candleWidth + candleWidth/2;
        const y = midM - v * scaleM;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Signal Line
      ctx.strokeStyle = "#F59E0B";
      ctx.beginPath();
      options.macdData.signalLine.forEach((v, i) => {
        const x = i * candleWidth + candleWidth/2;
        const y = midM - v * scaleM;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = "#00FFFF";
      ctx.font = "bold 9px monospace";
      ctx.fillText("MACD (12,26,9)", 10, 15);

      ctx.restore();
    }
  }

  drawFundamentalsOverlay(fundamentals: { label: string; value: number }[]) {
    const ctx = this.ctx;
    const padding = 20;
    const barWidth = (this.width - 2 * padding) / fundamentals.length;

    fundamentals.forEach((f, i) => {
      const x = padding + i * barWidth;
      const h = (f.value / 1000) * (this.height / 3);
      const y = this.height - h - 10;

      // Draw subtle bar
      ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
      ctx.fillRect(x + 5, y, barWidth - 10, h);

      // Draw top marker
      ctx.fillStyle = "cyan";
      ctx.beginPath();
      ctx.arc(x + barWidth / 2, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(f.label, x + barWidth / 2, y - 10);
      ctx.textAlign = "start";
    });
  }

  drawEarningsMarkers(earnings: { index: number }[]) {
    const ctx = this.ctx;
    const candleWidth = this.width / this.data.length;

    earnings.forEach(e => {
      if (e.index < 0 || e.index >= this.data.length) return;
      const x = (e.index * candleWidth) + candleWidth / 2;

      ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x - 5, 20);
      ctx.lineTo(x + 5, 20);
      ctx.fill();

      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("E", x, 32);
      ctx.textAlign = "start";
    });
  }

  drawMacroOverlay(events: { index: number; label: string }[]) {
    const ctx = this.ctx;
    const candleWidth = this.width / this.data.length;

    events.forEach(e => {
      if (e.index < 0 || e.index >= this.data.length) return;
      const x = (e.index * candleWidth) + candleWidth / 2;

      ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
      ctx.fillRect(x - 1, 0, 2, this.height);

      ctx.fillStyle = "#A855F7";
      ctx.font = "bold 8px monospace";
      ctx.save();
      ctx.translate(x + 10, this.height - 50);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(e.label, 0, 0);
      ctx.restore();
    });
  }

  drawMultiAssetOverlay(datasets: number[][]) {
    const ctx = this.ctx;
    const colors = ["#00FFFF", "#F59E0B", "#10B981"]; // Cyan, Amber, Emerald

    datasets.forEach((data, i) => {
      if (data.length < 2) return;
      
      const step = this.width / (data.length - 1);
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;

      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]); // Dotted line for comparison
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = index * step;
        const y = this.height - ((point - min) / range) * (this.height * 0.8) - (this.height * 0.1);
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label for the dataset
      ctx.fillStyle = colors[i % colors.length];
      ctx.font = "bold 9px monospace";
      ctx.fillText(`ALPHA_NODE_${i+1}`, 10, 50 + (i * 15));
    });
  }

  drawEMA(emaData: number[], color: string = "#00FFFF", showRSI?: boolean, showMACD?: boolean) {
    if (!this.data.length || !emaData.length) return;

    const ctx = this.ctx;
    const max = Math.max(...this.data.map(d => d.high));
    const min = Math.min(...this.data.map(d => d.low));

    // Define Pane Heights to match draw() logic
    const indicatorPaneHeight = 80;
    let mainChartHeight = this.height;
    if (showRSI) mainChartHeight -= indicatorPaneHeight;
    if (showMACD) mainChartHeight -= indicatorPaneHeight;

    const priceRange = max - min;
    const padding = priceRange * 0.1;
    const displayMax = max + padding;
    const displayMin = min - padding;
    const displayRange = displayMax - displayMin;

    const scaleY = mainChartHeight / displayRange;
    const candleWidth = this.width / this.data.length;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    emaData.forEach((value, i) => {
      const x = (i * candleWidth) + candleWidth / 2;
      const y = mainChartHeight - (value - displayMin) * scaleY;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }
}
