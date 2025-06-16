import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements OnInit {
  visible: boolean = false;
  title: string = '';
  message: string = '';

  ngOnInit() {
    this.visible = true;
    
  }

  hide() {
    this.visible = false;
  }

  confirm() {
    this.hide();
  }

  cancel() {
    // Logic for cancellation action
    this.hide();
  }

}
