import { Component, ElementRef, OnInit, AfterViewInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { dia, shapes, util, elementTools, linkTools, connectors, layout } from '@joint/core'

@Component({
  standalone: true,
  selector: 'diagram-editor',
  imports: [],
  templateUrl: './diagram-editor.component.html',
  styleUrl: './diagram-editor.component.css'
})
export class DiagramEditorComponent implements OnInit, AfterViewInit, OnDestroy {

  private paper: dia.Paper | null = null;
  private graph: dia.Graph | null = null;
  private zoomLevel: number = 1;
  private readonly zoomMin: number = 0.2;
  private readonly zoomMax: number = 3;
  private readonly zoomStep: number = 0.1;

  private isPanning: boolean = false;
  private panStart: { x: number; y: number } = { x: 0, y: 0 };
  private translateStart: { x: number; y: number } = { x: 0, y: 0 };

  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef;

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.graph = new dia.Graph();

    const container = this.paperContainer.nativeElement as HTMLElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.paper = new dia.Paper({
      el: this.paperContainer.nativeElement,
      model: this.graph,
      width: width,
      height: height,
      gridSize: 10,
      drawGrid: true,
      defaultLink: new shapes.standard.Link(),

    });

    const rect = new shapes.standard.Rectangle();
    rect.position(25, 100);
    rect.resize(100, 40);
    rect.attr({
      body: {
        fill: 'blue',
      },
      label: {
        text: 'Hello',
        fill: 'white',
      },
    });
    rect.addTo(this.graph);

    // Ativar zoom com o scroll do mouse
    container.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
    container.addEventListener('mousedown', this.onMouseDown.bind(this));
    container.addEventListener('mousemove', this.onMouseMove.bind(this));
    container.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  @HostListener('window:resize')
  onResize() {
    if (this.paper && this.paperContainer) {
      const container = this.paperContainer.nativeElement as HTMLElement;
      const width = container.clientWidth;
      const height = container.clientHeight;
      this.paper.setDimensions(width, height);
    }
  }


  private onMouseWheel(event: WheelEvent) {
    if (!this.paper) return;

    event.preventDefault();

    const zoomIn = event.deltaY < 0;

    let newZoom = this.zoomLevel + (zoomIn ? this.zoomStep : -this.zoomStep);
    newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, newZoom));

    // Obter posição do mouse em coordenadas do modelo (antes do zoom)
    const clientRect = this.paper.el.getBoundingClientRect();
    const clientX = event.clientX - clientRect.left;
    const clientY = event.clientY - clientRect.top;

    const currentPoint = this.paper.clientToLocalPoint({ x: clientX, y: clientY });

    // Aplicar novo zoom
    this.paper.scale(newZoom, newZoom);
    this.zoomLevel = newZoom;

    // Obter nova posição do mesmo ponto após o zoom
    const newClientPoint = this.paper.localToClientPoint(currentPoint);

    // Calcular quanto o canvas deve se mover para manter o ponto sob o cursor fixo
    const dx = clientX - newClientPoint.x;
    const dy = clientY - newClientPoint.y;

    const currentTranslate = this.paper.translate();
    this.paper.translate(currentTranslate.tx + dx, currentTranslate.ty + dy);
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.paper) return;

    // Verifica se o clique foi em área vazia
    const target = event.target as HTMLElement;
    const isBlank = target && target.getAttribute('magnet') !== 'true' && !target.closest('.joint-element');

    if (isBlank) {
      this.isPanning = true;
      this.panStart = { x: event.clientX, y: event.clientY };
      const { tx, ty } = this.paper.translate();
      this.translateStart = { x: tx, y: ty };
      this.setCursor('grabbing');
    }

  }

  private onMouseMove(event: MouseEvent) {
    if (!this.paper) return;

    if (this.isPanning) {
      const dx = event.clientX - this.panStart.x;
      const dy = event.clientY - this.panStart.y;
      this.paper.translate(this.translateStart.x + dx, this.translateStart.y + dy);
    } else {
      // Quando o mouse está em área vazia, mas não arrastando
      const target = event.target as HTMLElement;
      const isBlank = target && target.getAttribute('magnet') !== 'true' && !target.closest('.joint-element');
      this.setCursor(isBlank ? 'grab' : 'default');
    }
  }

  private onMouseUp(_: MouseEvent) {
    this.isPanning = false;
    this.setCursor('grab');
  }

  private setCursor(style: string) {
    if (this.paperContainer && this.paperContainer.nativeElement) {
      this.paperContainer.nativeElement.style.cursor = style;
    }
  }

  ngOnDestroy(): void {
    if (this.paper) {
      this.paper.remove();
      this.paper = null;
    }
    if (this.graph) {
      this.graph.clear();
      this.graph = null;
    }
  }

}
