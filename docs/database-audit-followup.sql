set lock_timeout='3s';
set statement_timeout='30s';
create index if not exists audit_inventory_movements_order_id_idx on app_v2.inventory_movements (order_id);
create index if not exists audit_legacy_users_auth_user_id_idx on app_v2.legacy_users (auth_user_id);
create index if not exists audit_legacy_users_referred_by_idx on app_v2.legacy_users (referred_by);
create index if not exists audit_order_design_refs_order_id_idx on app_v2.order_design_refs (order_id);
create index if not exists audit_order_design_refs_product_id_idx on app_v2.order_design_refs (product_id);
create index if not exists audit_order_items_product_id_idx on app_v2.order_items (product_id);
create index if not exists audit_orders_rep_user_id_idx on app_v2.orders (rep_user_id);
create index if not exists audit_orders_customer_id_idx on app_v2.orders (customer_id);
create index if not exists audit_orders_parent_order_id_idx on app_v2.orders (parent_order_id);
create index if not exists audit_product_media_product_id_idx on app_v2.product_media (product_id);
create index if not exists audit_referral_rewards_approved_by_legacy_id_idx on app_v2.referral_rewards (approved_by_legacy_id);
create index if not exists audit_referral_rewards_referred_legacy_id_idx on app_v2.referral_rewards (referred_legacy_id);
create index if not exists audit_referral_rewards_referrer_legacy_id_idx on app_v2.referral_rewards (referrer_legacy_id);
create index if not exists audit_rep_applications_referred_by_legacy_id_idx on app_v2.rep_applications (referred_by_legacy_id);
create index if not exists audit_rep_product_prices_product_id_idx on app_v2.rep_product_prices (product_id);
create index if not exists audit_shipment_notifications_order_id_idx on app_v2.shipment_notifications (order_id);
create index if not exists audit_wallet_entries_referral_reward_id_idx on app_v2.wallet_entries (referral_reward_id);
create index if not exists audit_wallet_entries_order_id_idx on app_v2.wallet_entries (order_id);
alter policy app_v2_customers_read on app_v2.customers using ((app_v2.is_admin() OR (auth_user_id = (select auth.uid()))));
alter policy app_v2_legacy_users_read on app_v2.legacy_users using ((app_v2.is_admin() OR (auth_user_id = (select auth.uid()))));
alter policy app_v2_order_items_read on app_v2.order_items using ((EXISTS ( SELECT 1
   FROM app_v2.orders o
  WHERE ((o.id = order_items.order_id) AND (app_v2.is_admin() OR (o.rep_user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
           FROM app_v2.customers c
          WHERE ((c.id = o.customer_id) AND (c.auth_user_id = (select auth.uid()))))))))));
alter policy app_v2_orders_read on app_v2.orders using ((app_v2.is_admin() OR (rep_user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM app_v2.customers c
  WHERE ((c.id = orders.customer_id) AND (c.auth_user_id = (select auth.uid())))))));

