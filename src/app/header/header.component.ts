import { Component, OnInit, EventEmitter, Input, Output, ViewChild, ViewContainerRef, OnDestroy } from '@angular/core';
import { LucideIconsModule } from '../lucide-icons.module';
import { StorageService } from '../../services/storage.service';
import { StoreComponent } from "../store/store.component";
import { BackpackComponent } from "../backpack/backpack.component";
import { DataService, UserResponse } from '../../services/data.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-header',
  imports: [LucideIconsModule, StoreComponent, BackpackComponent, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy{

  @Output() logoutEvent = new EventEmitter<void>();
  @Output() exitEvent = new EventEmitter<void>();
  @Output() storeToggleEvent = new EventEmitter<boolean>();

  @Input() parentType!: 'game-phase' | 'game-map';

  userData?: User;

  // Referência para o componente Store (loja de itens)
  @ViewChild(StoreComponent) store!: StoreComponent;

  // Referência para o componente Backpack (mochila)
  @ViewChild(BackpackComponent) backpack!: BackpackComponent;

  currentTime: string = '00:00:00';
  watchTime: string = '';
  private timerInterval: any;
  private watchTimerInterval: any;
  private timerPaused: boolean = false;
  private pausedTime: number = 0;
  private watchStartTime: number = 0;
  private watchDuration: number = 59 * 1000; // 59 seconds
  private startTime: number = 0;

  constructor(
    private dataService: DataService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData(Number(localStorage.getItem('userId')));
    if (this.parentType === 'game-phase') {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.watchTimerInterval) {
      clearInterval(this.watchTimerInterval);
    }
  }

  logout() {
    this.logoutEvent.emit();
  }

  exitGame() {
    this.exitEvent.emit();
  }

  toggleStore() {
    if (this.store) {
      this.store.toggle();
    }
  }

  toggleBackpack() {
    if (this.backpack) {
      this.backpack.toggle();
    }
  }
  
  onStoreStateChanged(isOpen: boolean) {
    this.storeToggleEvent.emit(isOpen);
  }

  private loadUserData(userId: number | null) {
    if(userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user: User) => {
          this.userData = user;
          console.log('user', this.userData);

        },
        error: (error) => {
          console.error('Erro ao carregar dados do usuário:', error);
          this.router.navigate(['/login']);
        }
      });
    }
    else {
      console.error('UserId is null');
      this.router.navigate(['/login']);
    }

    console.log('user', this.userData);
  }

  private startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (!this.timerPaused) {
        const elapsedTime = Date.now() - this.startTime;
        const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);

        this.currentTime = `${this.padNumber(hours)}:${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
      }
    }, 1000);
  }

  activateWatch() {
    if (!this.watchTimerInterval) {
      // Pause the main timer
      this.timerPaused = true;
      this.pausedTime = Date.now();

      // Start watch timer
      this.watchStartTime = Date.now();
      this.watchTimerInterval = setInterval(() => {
        const remainingTime = this.watchDuration - (Date.now() - this.watchStartTime);

        if (remainingTime <= 0) {
          // Watch time finished
          clearInterval(this.watchTimerInterval);
          this.watchTimerInterval = null;
          this.watchTime = '';

          // Resume main timer
          this.timerPaused = false;
          const pauseDuration = Date.now() - this.pausedTime;
          this.startTime += pauseDuration;
        } else {
          // Update watch time display
          const minutes = Math.floor(remainingTime / (1000 * 60));
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
          this.watchTime = `+${this.padNumber(minutes)}:${this.padNumber(seconds)}`;
        }
      }, 1000);
    }
  }

  private padNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

}
