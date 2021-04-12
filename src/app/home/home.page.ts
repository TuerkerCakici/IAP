import { Component, ChangeDetectorRef } from '@angular/core';
import { Platform, AlertController } from '@ionic/angular';
import {
  InAppPurchase2,
  IAPProduct,
} from '@ionic-native/in-app-purchase-2/ngx';

const PRODUCT_GEMS_KEY = 'invites50';
const PRODUCT_PRO_KEY = 'inviteplus';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  gems = 0;
  isPro = false;
  products: IAPProduct[] = [];
  test: string;

  constructor(
    private plt: Platform,
    private store: InAppPurchase2,
    private alertController: AlertController,
    private ref: ChangeDetectorRef
  ) {
    this.plt.ready().then(() => {
      // Only for debugging!
      this.store.verbosity = this.store.DEBUG;

      this.registerProducts();
      this.setupListeners();

      // Get the real product information
      this.store.ready(() => {
        this.products = this.store.products;
        this.ref.detectChanges();
      });
    });
  }

  registerProducts() {
    this.store.register({
      id: PRODUCT_GEMS_KEY,
      type: this.store.CONSUMABLE,
    });

    this.store.register({
      id: PRODUCT_PRO_KEY,
      type: this.store.NON_CONSUMABLE,
    });

    this.store.refresh();
  }

  setupListeners() {
    // General query to all products
    this.store
      .when('product')
      .approved((p: IAPProduct) => {
        // Handle the product deliverable
        if (p.id === PRODUCT_PRO_KEY) {
          this.isPro = true;
        } else if (p.id === PRODUCT_GEMS_KEY) {
          this.gems += 100;
        }
        this.ref.detectChanges();

        return p.verify();
      })
      .verified((p: IAPProduct) => p.finish());

    // Specific query for one ID
    this.store.when(PRODUCT_PRO_KEY).owned((p: IAPProduct) => {
      this.isPro = true;
      this.test = `Hat Keys ${{ p }}`;
    });
    this.store.when(PRODUCT_GEMS_KEY).owned((p: IAPProduct) => {
      this.test = `Hat Keys ${{ p }}`;
    });
  }

  purchase(product: IAPProduct) {
    this.store.order(product).then(
      (p) => {
        // Purchase in progress!
      },
      (e) => {
        this.presentAlert('Failed', `Failed to purchase: ${e}`);
      }
    );
  }

  // To comply with AppStore rules
  restore() {
    this.store.refresh();
  }

  async presentAlert(header, message) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
