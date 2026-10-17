alter policy app_v2_customers_read on app_v2.customers using ((app_v2.is_admin() OR (auth_user_id = auth.uid())));
alter policy app_v2_legacy_users_read on app_v2.legacy_users using ((app_v2.is_admin() OR (auth_user_id = auth.uid())));
alter policy app_v2_order_items_read on app_v2.order_items using ((EXISTS ( SELECT 1
   FROM app_v2.orders o
  WHERE ((o.id = order_items.order_id) AND (app_v2.is_admin() OR (o.rep_user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM app_v2.customers c
          WHERE ((c.id = o.customer_id) AND (c.auth_user_id = auth.uid())))))))));
alter policy app_v2_orders_read on app_v2.orders using ((app_v2.is_admin() OR (rep_user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM app_v2.customers c
  WHERE ((c.id = orders.customer_id) AND (c.auth_user_id = auth.uid()))))));
drop index if exists app_v2.audit_inventory_movements_order_id_idx;
drop index if exists app_v2.audit_legacy_users_auth_user_id_idx;
drop index if exists app_v2.audit_legacy_users_referred_by_idx;
drop index if exists app_v2.audit_order_design_refs_order_id_idx;
drop index if exists app_v2.audit_order_design_refs_product_id_idx;
drop index if exists app_v2.audit_order_items_product_id_idx;
drop index if exists app_v2.audit_orders_rep_user_id_idx;
drop index if exists app_v2.audit_orders_customer_id_idx;
drop index if exists app_v2.audit_orders_parent_order_id_idx;
drop index if exists app_v2.audit_product_media_product_id_idx;
drop index if exists app_v2.audit_referral_rewards_approved_by_legacy_id_idx;
drop index if exists app_v2.audit_referral_rewards_referred_legacy_id_idx;
drop index if exists app_v2.audit_referral_rewards_referrer_legacy_id_idx;
drop index if exists app_v2.audit_rep_applications_referred_by_legacy_id_idx;
drop index if exists app_v2.audit_rep_product_prices_product_id_idx;
drop index if exists app_v2.audit_shipment_notifications_order_id_idx;
drop index if exists app_v2.audit_wallet_entries_referral_reward_id_idx;
drop index if exists app_v2.audit_wallet_entries_order_id_idx;
