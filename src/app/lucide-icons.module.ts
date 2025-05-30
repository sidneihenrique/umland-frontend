import { NgModule } from '@angular/core';
import { LucideAngularModule, Sparkle } from 'lucide-angular';
import { 
        X, 
        Store, 
        Backpack, 
        CircleDollarSign, 
        Sparkles, 
        MoveUpRight,
        Lightbulb,
        BookCheck,
        MessageCircleQuestion,
        Save } from 'lucide-angular';

@NgModule({
  imports: [LucideAngularModule.pick({ 
                                      X, 
                                      Store,
                                      Backpack, 
                                      CircleDollarSign, 
                                      Sparkles, 
                                      MoveUpRight,
                                      Lightbulb,
                                      BookCheck,
                                      MessageCircleQuestion,
                                      Save })],
  exports: [LucideAngularModule],
})
export class LucideIconsModule {}