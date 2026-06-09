-- Automobile platform starter seed.
-- Run after supabase/migrations/20260523000100_automobile_foundation.sql
-- and supabase/migrations/20260525000100_city_default_rto_id.sql.

insert into vehicle_categories (id, name, slug, description, active) values
('00000000-0000-4000-8000-000000000001', 'Cars', 'cars', 'Hatchbacks, sedans, SUVs and MUVs.', true),
('00000000-0000-4000-8000-000000000002', 'Bikes', 'bikes', 'Commuter, cruiser and performance bikes.', true),
('00000000-0000-4000-8000-000000000003', 'Scooters', 'scooters', 'ICE and electric scooters.', true),
('00000000-0000-4000-8000-000000000004', 'EV Vehicles', 'ev-vehicles', 'Electric cars, scooters and bikes.', true),
('00000000-0000-4000-8000-000000000005', 'Commercial Vehicles', 'commercial-vehicles', 'Trucks, pickups, buses and fleet vehicles.', true),
('00000000-0000-4000-8000-000000000006', 'EV Commercial Vehicles', 'ev-commercial-vehicles', 'Electric cargo, fleet and commercial mobility.', true),
('00000000-0000-4000-8000-000000000007', 'Passenger EV Vehicles', 'passenger-ev-vehicles', 'Electric rickshaws, e-autos and passenger electric mobility vehicles.', true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, active = excluded.active;

insert into brands (id, name, slug, active, featured) values
('00000000-0000-4000-8000-000000000101', 'Hyundai', 'hyundai', true, true),
('00000000-0000-4000-8000-000000000102', 'Tata', 'tata', true, true),
('00000000-0000-4000-8000-000000000103', 'Mahindra', 'mahindra', true, true),
('00000000-0000-4000-8000-000000000104', 'Ather', 'ather', true, true),
('00000000-0000-4000-8000-000000000105', 'Royal Enfield', 'royal-enfield', true, true),
('00000000-0000-4000-8000-000000000106', 'Euler Motors', 'euler-motors', true, false)
on conflict (slug) do update set name = excluded.name, active = excluded.active, featured = excluded.featured;

insert into states (id, name, code) values
('00000000-0000-4000-8000-000000000201', 'Karnataka', 'KA'),
('00000000-0000-4000-8000-000000000202', 'Maharashtra', 'MH'),
('00000000-0000-4000-8000-000000000203', 'Delhi', 'DL')
on conflict (code) do update set name = excluded.name;

insert into cities (id, state_id, name, slug, default_rto_id) values
('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', 'Bengaluru', 'bangalore', '00000000-0000-4000-8000-000000000401'),
('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000202', 'Mumbai', 'mumbai', '00000000-0000-4000-8000-000000000402'),
('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000203', 'Delhi', 'delhi', '00000000-0000-4000-8000-000000000403')
on conflict (slug) do update set name = excluded.name, state_id = excluded.state_id, default_rto_id = excluded.default_rto_id;

insert into rto_offices (id, state_id, city_id, code, name) values
('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301', 'KA-03', 'Bengaluru East RTO'),
('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000302', 'MH-01', 'Mumbai Central RTO'),
('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000303', 'DL-01', 'Delhi North RTO')
on conflict (id) do update set code = excluded.code, name = excluded.name;

insert into vehicle_models (id, brand_id, category_id, name, slug, body_type, image_url, overview, pros, cons, active, featured) values
('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Creta', 'creta', 'SUV', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80', 'Hyundai Creta is positioned as a practical midsize SUV with strong feature spread and city-wise on-road price impact.', '["Strong variant spread","Premium cabin feel","Diesel automatic option"]'::jsonb, '["Top variants can become expensive","Waiting period may vary by city"]'::jsonb, true, true),
('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Nexon', 'nexon', 'Compact SUV', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80', 'Tata Nexon is a compact SUV focused on safety, high ground clearance and city-friendly size.', '["Strong safety positioning","Compact footprint","Multiple powertrain choices"]'::jsonb, '["Rear seat width is average","AMT feel may not suit every buyer"]'::jsonb, true, true),
('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'XUV700', 'xuv700', 'SUV', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80', 'Mahindra XUV700 is a larger SUV for buyers prioritising space, performance and advanced features.', '["Powerful engines","Seven-seat availability","Feature-loaded top trims"]'::jsonb, '["Higher on-road price","Large footprint for tight city use"]'::jsonb, true, true),
('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000004', '450X', '450x', 'Electric Scooter', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80', 'Ather 450X is an electric scooter for urban riders who want connected features and lower running cost.', '["Low running cost","Connected dashboard","Quick city performance"]'::jsonb, '["Charging access matters","Range depends on riding mode"]'::jsonb, true, true),
('00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000002', 'Classic 350', 'classic-350', 'Cruiser Bike', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80', 'Royal Enfield Classic 350 is a retro-styled motorcycle for relaxed city and highway riding.', '["Relaxed riding posture","Strong brand pull","Comfortable cruising"]'::jsonb, '["Not a sporty commuter","Weight can feel high in traffic"]'::jsonb, true, true),
('00000000-0000-4000-8000-000000000506', '00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000006', 'HiLoad EV', 'hiload-ev', 'Electric Cargo Three-Wheeler', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=80', 'Euler HiLoad EV is built for electric last-mile cargo use with lower running cost.', '["Low running cost","Cargo-focused EV","Fleet-friendly positioning"]'::jsonb, '["Charging planning required","Range depends on load and route"]'::jsonb, true, true)
on conflict (slug) do update set name = excluded.name, brand_id = excluded.brand_id, category_id = excluded.category_id, body_type = excluded.body_type, image_url = excluded.image_url, overview = excluded.overview, pros = excluded.pros, cons = excluded.cons, active = excluded.active, featured = excluded.featured;

insert into vehicle_variants (id, model_id, name, slug, ex_showroom_price, fuel_type, transmission, engine_capacity, mileage, seating_capacity, specifications, specification_groups, active) values
('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000501', 'SX Optional Diesel AT', 'sx-optional-diesel-at', 1890000, 'Diesel', 'Automatic', '1493 cc', '19.1 km/l', 5, '{"colors":["Atlas White","Abyss Black","Titan Grey","Ranger Khaki","Fiery Red"],"features":["Wireless charging","Connected car tech","Cruise control","Drive modes","Rear AC vents"],"highlights":["Strong diesel automatic option","Feature-rich city SUV"],"engine":{"displacement":"1493 cc","maxPower":"114 bhp","maxTorque":"250 Nm","cylinders":"4 cylinders","driveType":"Front-wheel drive","emissionNorm":"BS6 Phase 2"},"dimensions":{"length":"4330 mm","width":"1790 mm","height":"1635 mm","wheelbase":"2610 mm","bootSpace":"433 litres","groundClearance":"190 mm"},"interior":{"upholstery":"Leatherette seats","dashboard":"Dual-tone dashboard","infotainment":"10.25-inch touchscreen","speakers":"Premium 8-speaker system","airConditioning":"Automatic climate control","seatFeatures":"Ventilated front seats"},"exterior":{"headlamps":"LED headlamps","wheels":"17-inch alloy wheels","roofRails":"Functional roof rails","sunroof":"Panoramic sunroof"},"safety":{"airbags":"6 airbags","abs":"ABS with EBD","esc":"Electronic stability control","camera":"Rear camera","sensors":"Front and rear parking sensors","rating":"5-star safety positioning"}}'::jsonb, '[{"title":"Engine and performance","fields":[{"label":"Engine","value":"1493 cc"},{"label":"Power","value":"114 bhp"},{"label":"Torque","value":"250 Nm"}]},{"title":"Safety","fields":[{"label":"Airbags","value":"6 airbags"},{"label":"ABS","value":"ABS with EBD"}]}]'::jsonb, true),
('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000501', 'S Petrol MT', 's-petrol-mt', 1340000, 'Petrol', 'Manual', '1497 cc', '17.4 km/l', 5, '{"colors":["Atlas White","Abyss Black","Titan Grey"],"features":["Cruise control","Rear AC vents"],"highlights":["Balanced petrol manual choice"],"engine":{"displacement":"1497 cc","maxPower":"113 bhp","maxTorque":"144 Nm","cylinders":"4 cylinders","driveType":"Front-wheel drive","emissionNorm":"BS6 Phase 2"},"dimensions":{},"interior":{},"exterior":{},"safety":{}}'::jsonb, '[]'::jsonb, true),
('00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000502', 'Creative Plus AMT', 'creative-plus-amt', 1270000, 'Petrol', 'AMT', '1199 cc', '17.2 km/l', 5, '{"colors":["Fearless Purple","Daytona Grey","Pristine White"],"features":["Touchscreen","Airbags","Connected features"],"highlights":["Compact SUV footprint","Strong safety reputation"],"engine":{"displacement":"1199 cc"},"dimensions":{},"interior":{},"exterior":{},"safety":{"rating":"Strong safety positioning"}}'::jsonb, '[]'::jsonb, true),
('00000000-0000-4000-8000-000000000604', '00000000-0000-4000-8000-000000000503', 'AX7 Luxury Diesel AT', 'ax7-luxury-diesel-at', 2490000, 'Diesel', 'Automatic', '2198 cc', '16.6 km/l', 7, '{"colors":["Electric Blue","Midnight Black","Everest White"],"features":["ADAS suite","Dual-zone climate control","Memory seats"],"highlights":["Seven-seat SUV","Powerful diesel automatic"],"engine":{"displacement":"2198 cc"},"dimensions":{},"interior":{},"exterior":{},"safety":{}}'::jsonb, '[]'::jsonb, true),
('00000000-0000-4000-8000-000000000605', '00000000-0000-4000-8000-000000000504', '450X Pro Pack', '450x-pro-pack', 149000, 'Electric', 'Automatic', '3.7 kWh', '111 km range', 2, '{"colors":["Space Grey","Still White","True Red"],"features":["Fast charging","Navigation","Ride modes","OTA updates"],"highlights":["Low running cost","Connected EV dashboard"],"engine":{"displacement":"3.7 kWh battery"},"dimensions":{},"interior":{},"exterior":{},"safety":{}}'::jsonb, '[]'::jsonb, true),
('00000000-0000-4000-8000-000000000606', '00000000-0000-4000-8000-000000000505', 'Redditch', 'redditch', 193000, 'Petrol', 'Manual', '349 cc', '35 km/l', 2, '{"colors":["Redditch Red","Halcyon Black","Chrome Bronze"],"features":["Dual-channel ABS","USB charging"],"highlights":["Retro cruiser feel","Strong torque delivery"],"engine":{"displacement":"349 cc"},"dimensions":{},"interior":{},"exterior":{},"safety":{}}'::jsonb, '[]'::jsonb, true),
('00000000-0000-4000-8000-000000000607', '00000000-0000-4000-8000-000000000506', 'Standard', 'standard', 390000, 'Electric', 'Automatic', '12.4 kWh', '170 km range', 1, '{"colors":["White","Green","Blue"],"features":["Fast charging","Fleet telematics","Cargo body"],"highlights":["Last-mile cargo EV","Fleet use case"],"engine":{"displacement":"12.4 kWh battery"},"dimensions":{},"interior":{},"exterior":{},"safety":{}}'::jsonb, '[]'::jsonb, true)
on conflict (model_id, slug) do update set name = excluded.name, ex_showroom_price = excluded.ex_showroom_price, fuel_type = excluded.fuel_type, transmission = excluded.transmission, engine_capacity = excluded.engine_capacity, mileage = excluded.mileage, seating_capacity = excluded.seating_capacity, specifications = excluded.specifications, specification_groups = excluded.specification_groups, active = excluded.active;

insert into vehicle_media (id, model_id, variant_id, color_name, url, alt, media_type, display_order, active) values
('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', null, 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=85', 'Hyundai Creta front exterior', 'exterior', 1, true),
('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', 'Atlas White', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=85', 'Hyundai Creta Atlas White exterior', 'color', 2, true),
('00000000-0000-4000-8000-000000000703', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000603', null, 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85', 'Tata Nexon exterior', 'exterior', 1, true),
('00000000-0000-4000-8000-000000000704', '00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000605', null, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85', 'Ather 450X exterior', 'exterior', 1, true)
on conflict (id) do update set url = excluded.url, alt = excluded.alt, media_type = excluded.media_type, display_order = excluded.display_order, active = excluded.active;

insert into state_tax_rules (id, state_id, category_id, fuel_type, min_price, max_price, road_tax_percent, fixed_tax_amount, ev_exemption_percent, luxury_cess_percent, active) values
('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', null, 0, 1500000, 14, 0, 0, 0, true),
('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', null, 1500001, null, 18, 0, 0, 1, true),
('00000000-0000-4000-8000-000000000803', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000004', 'Electric', 0, null, 4, 0, 75, 0, true),
('00000000-0000-4000-8000-000000000804', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', null, 0, null, 13, 0, 0, 0, true),
('00000000-0000-4000-8000-000000000805', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', null, 0, null, 10, 0, 0, 0, true)
on conflict (id) do update set road_tax_percent = excluded.road_tax_percent, active = excluded.active;

insert into rto_charges (id, state_id, city_id, rto_id, registration_fee, smart_card_fee, number_plate_fee, hypothecation_fee, fastag_fee, handling_charges, active) values
('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000401', 18000, 600, 1200, 1500, 600, 7500, true),
('00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000402', 18000, 600, 1200, 1500, 600, 9000, true),
('00000000-0000-4000-8000-000000000903', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000403', 12000, 600, 1200, 1500, 600, 7500, true)
on conflict (id) do update set registration_fee = excluded.registration_fee, handling_charges = excluded.handling_charges, active = excluded.active;

insert into insurance_rules (id, category_id, fuel_type, percent_of_ex_showroom, fixed_amount, active) values
('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-000000000001', null, 3.2, 15000, true),
('00000000-0000-4000-8000-000000001002', '00000000-0000-4000-8000-000000000004', 'Electric', 2.4, 4500, true),
('00000000-0000-4000-8000-000000001003', '00000000-0000-4000-8000-000000000002', null, 2.5, 3500, true)
on conflict (id) do update set percent_of_ex_showroom = excluded.percent_of_ex_showroom, fixed_amount = excluded.fixed_amount, active = excluded.active;

insert into dealers (id, name, slug, city_id, area, contact_person, phone, email, active, verified, priority) values
('00000000-0000-4000-8000-000000001101', 'Greenline Hyundai Bengaluru', 'greenline-hyundai-bengaluru', '00000000-0000-4000-8000-000000000301', 'Whitefield', 'Anita Rao', '+91 98765 43001', 'leads@greenline.example', true, true, 2),
('00000000-0000-4000-8000-000000001102', 'TrustDrive Motors Mumbai', 'trustdrive-motors-mumbai', '00000000-0000-4000-8000-000000000302', 'Andheri East', 'Rahul Shah', '+91 98765 43002', 'sales@trustdrive.example', true, true, 1),
('00000000-0000-4000-8000-000000001103', 'EV Avenue Delhi', 'ev-avenue-delhi', '00000000-0000-4000-8000-000000000303', 'Saket', 'Meera Sethi', '+91 98765 43003', 'hello@evavenue.example', true, true, 3)
on conflict (slug) do update set name = excluded.name, city_id = excluded.city_id, area = excluded.area, contact_person = excluded.contact_person, active = excluded.active, verified = excluded.verified, priority = excluded.priority;

insert into dealer_brand_mappings (id, dealer_id, brand_id, city_id, active) values
('00000000-0000-4000-8000-000000001201', '00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000301', true),
('00000000-0000-4000-8000-000000001202', '00000000-0000-4000-8000-000000001102', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000302', true),
('00000000-0000-4000-8000-000000001203', '00000000-0000-4000-8000-000000001103', '00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000303', true)
on conflict (dealer_id, brand_id, city_id) do update set active = excluded.active;

insert into offers (id, title, description, dealer_id, brand_id, model_id, city_id, discount_amount, sponsor_type, placement, active) values
('00000000-0000-4000-8000-000000001301', 'Dealer exchange bonus', 'Exchange bonus available through mapped Hyundai dealer in Bengaluru.', '00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000301', 25000, 'dealer', 'dealer_card', true),
('00000000-0000-4000-8000-000000001302', 'Free accessory kit', 'Dealer-provided accessory package on selected Creta variants this month.', '00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000301', 15000, 'dealer', 'dealer_card', true)
on conflict (id) do update set title = excluded.title, description = excluded.description, discount_amount = excluded.discount_amount, active = excluded.active;

insert into seo_pages (id, slug, page_kind, title, h1, meta_title, meta_description, intro, body, faq, filters, show_on_homepage, show_in_footer, active) values
('00000000-0000-4000-8000-000000001401', 'hyundai-creta-on-road-price-in-bangalore', 'model_price', 'Hyundai Creta On-Road Price in Bangalore', 'Hyundai Creta on-road price in Bangalore', 'Hyundai Creta On-Road Price in Bangalore | AutoPrice', 'Check Hyundai Creta variant-wise on-road price in Bangalore with tax, RTO, insurance and dealer enquiry.', 'Compare Hyundai Creta variants with transparent Bangalore on-road pricing before visiting the showroom.', 'This page uses live variant prices and Karnataka tax assumptions from the platform pricing engine.', '[{"question":"Does this include road tax?","answer":"Yes. The estimate includes road tax, RTO fees, insurance and common handling charges."}]'::jsonb, '{"cityId":"00000000-0000-4000-8000-000000000301","brandId":"00000000-0000-4000-8000-000000000101","modelId":"00000000-0000-4000-8000-000000000501"}'::jsonb, true, true, true)
on conflict (slug) do update set title = excluded.title, h1 = excluded.h1, meta_title = excluded.meta_title, meta_description = excluded.meta_description, intro = excluded.intro, body = excluded.body, faq = excluded.faq, filters = excluded.filters, active = excluded.active;

insert into comparison_pages (id, slug, title, city_id, vehicle_1_model_id, vehicle_1_variant_id, vehicle_2_model_id, vehicle_2_variant_id, meta_title, meta_description, intro, verdict, faq, show_on_homepage, show_in_footer, display_order, active) values
('00000000-0000-4000-8000-000000001501', 'hyundai-creta-vs-tata-nexon', 'Hyundai Creta vs Tata Nexon', '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000603', 'Hyundai Creta vs Tata Nexon On-Road Price Comparison', 'Compare Hyundai Creta and Tata Nexon by on-road price, specs, features, mileage, safety and dealer offers.', 'Creta and Nexon are popular SUV choices for comfort, city pricing and ownership value.', 'Choose Creta for larger SUV feel and diesel automatic. Choose Nexon for compact size and value.', '[{"question":"Which is cheaper on-road?","answer":"Nexon is cheaper in this seeded comparison, but final city price depends on variant and offers."}]'::jsonb, true, true, 1, true)
on conflict (slug) do update set title = excluded.title, meta_title = excluded.meta_title, meta_description = excluded.meta_description, intro = excluded.intro, verdict = excluded.verdict, faq = excluded.faq, show_on_homepage = excluded.show_on_homepage, show_in_footer = excluded.show_in_footer, active = excluded.active;

notify pgrst, 'reload schema';
