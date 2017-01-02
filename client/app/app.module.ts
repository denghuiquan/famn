import { NgModule, ApplicationRef } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { HttpModule } from '@angular/http'
import { RouterModule } from '@angular/router'
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr'

import './app.global.scss'

/**
 * Import ngrx
 */
import { compose } from '@ngrx/core/compose'
import { Store, StoreModule, ActionReducer, combineReducers } from '@ngrx/store'
import { StoreDevtoolsModule } from '@ngrx/store-devtools'
import { StoreLogMonitorModule, useLogMonitor } from '@ngrx/store-log-monitor'

import { MaterialModule } from '@angular/material'
import { FlexLayoutModule } from '@angular/flex-layout'

/**
 * Import toplevel component/providers/directives/pipes
 */
import { AppComponent } from './app.component'
import { LoginComponent } from './login/login.component'
import { SignupComponent } from './signup/signup.component'
import { PageNotFoundComponent } from './404/404.component'
import { SocketService, AuthGuard } from './app.service'
import { ROUTES } from './app.routes'
import { ENV_PROVIDERS } from './env'



/**
 * Reducer for @ngrx/store
 */
import { message } from '../reducer'

// Reset the root state for HMR
function stateSetter(reducer: ActionReducer<any>): ActionReducer<any> {
  return function (state, action) {
    if (action.type === 'SET_ROOT_STATE') {
      return action.payload
    }
    return reducer(state, action)
  }
}

const rootReducer = compose(stateSetter, combineReducers)({
  message
})

let imports = [
  BrowserModule,
  FormsModule,
  HttpModule,
  CommonModule,
  MaterialModule.forRoot(),
  FlexLayoutModule.forRoot(),
  RouterModule.forRoot(ROUTES, {
    useHash: true
  }),

  StoreLogMonitorModule,
  StoreModule.provideStore(rootReducer)
]

// Enable HMR and ngrx/devtools in hot reload mode
if (module.hot) imports.push(...[
  StoreDevtoolsModule.instrumentStore({
    monitor: useLogMonitor({
      visible: false,
      position: 'right'
    })
  }),
  // StoreLogMonitorModule,
])

@NgModule({
  bootstrap: [
    AppComponent
  ],
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    PageNotFoundComponent
  ],
  imports,
  providers: [
    ENV_PROVIDERS,
    SocketService,
    AuthGuard
  ]
})

export class AppModule {
  constructor(public appRef: ApplicationRef, private _store: Store<any>) { }
  hmrOnInit(store) {
    if (!store || !store.rootState) return

    // restore state
    if (store.rootState) {
      this._store.dispatch({
        type: 'SET_ROOT_STATE',
        payload: store.rootState
      })
    }

    // restore input values
    if ('restoreInputValues' in store) { store.restoreInputValues() }
    this.appRef.tick()
    Object.keys(store).forEach(prop => delete store[prop])
  }
  hmrOnDestroy(store) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement)
    this._store.subscribe(s => store.rootState = s)
    // recreate elements
    store.disposeOldHosts = createNewHosts(cmpLocation)
    // save input values
    store.restoreInputValues = createInputTransfer()
    // remove styles
    removeNgStyles()
  }
  hmrAfterDestroy(store) {
    // display new elements
    store.disposeOldHosts()
    delete store.disposeOldHosts
  }
}
