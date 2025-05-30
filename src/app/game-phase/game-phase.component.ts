import { Component } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { DiagramEditorComponent } from '../diagram-editor/diagram-editor.component';

@Component({
  selector: 'game-phase',
  standalone: true,
  imports: [LucideIconsModule, DiagramEditorComponent],
  templateUrl: './game-phase.component.html',
  styleUrl: './game-phase.component.css'
})
export class GamePhaseComponent {

}
