import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, NEVER, Observable, Subject, Subscription } from 'rxjs';
import { catchError, distinctUntilChanged, map, shareReplay, switchMap, tap, withLatestFrom } from 'rxjs/operators';

export interface AppState {
  limit: number;
  offset: number;
  pokemons: any[]
}

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  private state = new BehaviorSubject<AppState>({
    limit: 10,
    offset: 0,
    pokemons: [],
  });

  private increaseLimitAction = new Subject<number>();
  private decreaseLimitAction = new Subject<number>();
  private increaseOffsetAction = new Subject<number>();
  private decreaseOffsetAction = new Subject<number>();

  private loadPokeminAcction = new Subject<void>();
  private loadPokemonSuccessAction = new Subject<any[]>();
  private loadPokemonErrorAction = new Subject<any>();

  limit$ = this.createSelector(state => state.limit);
  offset$ = this.createSelector(state => state.offset);
  pokemons$ = this.createSelector(state => state.pokemons);

  constructor(
    private http: HttpClient,
  ) {
    this.createEffect((this.loadPokeminAcction.pipe(
      withLatestFrom(this.limit$, this.offset$),
      switchMap(([_, limit, offset]) => {
        return this.http.get<any>(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
          .pipe(catchError(err => {
            this.loadPokemonErrorAction.next(err);
            return NEVER
          }))
      }), tap(response => {
        this.loadPokemonSuccessAction.next(response.results)
      })
    )))

    this.createEffect(this.loadPokemonErrorAction.pipe(tap(err => {
      console.log(err);

    })))

    this.createReducer(this.loadPokemonSuccessAction, (state, pokemons) => {
      state.pokemons = pokemons
      return state;
    })

    this.createReducer(this.increaseLimitAction, (state, limit) => {
      state.limit += limit
      return state;
    })

    this.createReducer(this.decreaseLimitAction, (state, limit) => {
      state.limit -= limit
      return state;
    })

    this.createReducer(this.increaseOffsetAction, (state, offset) => {
      state.offset += offset
      return state;
    })

    this.createReducer(this.decreaseOffsetAction, (state, offset) => {
      state.offset -= offset
      return state;
    })

  }

  increaseLimit(limit: number) {
    this.increaseLimitAction.next(limit);
  }

  decreaseLimit(limit: number) {
    this.decreaseLimitAction.next(limit);
  }

  increaseOffset(offset: number) {
    this.increaseOffsetAction.next(offset);
  }

  decreaseOffset(offset: number) {
    this.decreaseOffsetAction.next(offset);
  }

  loadPokemon() {
    this.loadPokeminAcction.next();
  }

  private createSelector<T>(selector: (state: AppState) => T): Observable<T> {
    return this.state.pipe(
      map(selector),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  private createReducer<T>(
    action$: Observable<T>,
    accumulator: (state: AppState, action: T) => AppState
  ) {
    action$.subscribe((action) => {
      const state = { ...this.state.value };
      const newState = accumulator(state, action);
      this.state.next(newState)
    })
  }

  private createEffect<T>(effet$: Observable<T>): Subscription {
    return effet$.subscribe();
  }
}
