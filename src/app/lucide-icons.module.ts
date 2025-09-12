import { NgModule } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
// Importa os ícones para o componente game-phase
import {
  X,
  Store,
  Backpack,
  CircleDollarSign,
  Sparkles,
  MoveUpRight,
  MoveDownRight,
  Lightbulb,
  BookCheck,
  ChevronLeft,
  ChevronRight,
  MessageCircleQuestion,
  Save,
  TriangleAlert,
  CircleCheckBig,
  RotateCcw,
  LogOut,
  SquareCheck,
  Infinity
} from 'lucide-angular';

@NgModule({
  imports: [LucideAngularModule.pick({
    X,
    Store,
    Backpack,
    CircleDollarSign,
    Sparkles,
    MoveUpRight,
    MoveDownRight,
    Lightbulb,
    BookCheck,
    ChevronLeft,
    ChevronRight,
    MessageCircleQuestion,
    Save,
    TriangleAlert,
    CircleCheckBig,
    RotateCcw,
    LogOut,
    SquareCheck,
    Infinity
  })],
  exports: [LucideAngularModule],
})
export class LucideIconsModule { }