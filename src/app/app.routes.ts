import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { GamePhaseComponent } from './game-phase/game-phase.component';
import { AuthGuard } from './auth/auth-guard';
import { GameMapComponent } from './game-map/game-map.component';
import { RegisterComponent } from './register/register.component';


export const routes: Routes = [
    { path: '', component: LoginComponent,
      canActivate: [AuthGuard]
     },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'map',
      component: GameMapComponent,
      canActivate: [AuthGuard]
    },
    { 
      path: 'game/:id', 
      component: GamePhaseComponent,
      canActivate: [AuthGuard] // <--- proteje a rota
    }
];
