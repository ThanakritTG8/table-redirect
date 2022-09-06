import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { StoreService } from 'src/store/store.service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit {

  constructor( public store: StoreService) { }

  ngOnInit(): void {
  }

}
