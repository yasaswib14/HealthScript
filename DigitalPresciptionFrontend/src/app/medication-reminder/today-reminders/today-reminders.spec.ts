import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodayReminders } from './today-reminders';

describe('TodayReminders', () => {
  let component: TodayReminders;
  let fixture: ComponentFixture<TodayReminders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodayReminders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodayReminders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
