import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { GamePhaseComponent } from './game-phase/game-phase.component';
import { AuthGuard } from './auth/auth-guard';
import { AdminPanelComponent } from './admin-panel/admin-panel.component';
import { GameMapComponent } from './game-map/game-map.component';
import { RegisterComponent } from './register/register.component';
import { SelectMapComponent } from './select-map/select-map.component';
import { CreditsComponent } from './credits/credits.component';


export const routes: Routes = [
    { path: '', component: LoginComponent,
      canActivate: [AuthGuard]
     },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'map/:id',
      component: GameMapComponent,
      canActivate: [AuthGuard]
    },
    { 
      path: 'game/:id', 
      component: GamePhaseComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'admin',
      component: AdminPanelComponent
    },
    {
      path: 'select-map',
      component: SelectMapComponent,
      canActivate: [AuthGuard]
    },
    {
      path: 'credits',
      component: CreditsComponent
    }
];
