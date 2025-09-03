import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { GamePhaseComponent } from './game-phase/game-phase.component';
import { AuthGuard } from './auth/auth-guard'; 
import { GameMapComponent } from './game-map/game-map.component';


export const routes: Routes = [
    { path: '', component: GamePhaseComponent },
    { path: 'login', component: LoginComponent },
    { path: 'map', component: GameMapComponent},
    { 
      path: 'game', 
      component: GamePhaseComponent,
      canActivate: [AuthGuard] // <--- proteje a rota
    }
];
