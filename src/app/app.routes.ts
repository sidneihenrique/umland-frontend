import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { GamePhaseComponent } from './game-phase/game-phase.component';

export const routes: Routes = [
    { path: '', component: GamePhaseComponent },
    { path: 'login', component: LoginComponent },
    { path: 'game', component: GamePhaseComponent }
];
