-- ==============================================================================
-- MORS Seed Data: supabase/seed.sql
-- Hyderabad Beta Flavored Canonical Dishes, Places, Categories & Test Personas
-- ==============================================================================

-- 1. Food Categories
INSERT INTO public.food_categories (slug, label, sort_order, is_active) VALUES
  ('restaurant', 'Restaurant', 1, true),
  ('street_food', 'Street Food', 2, true),
  ('home_cooked', 'Home Cooked', 3, true),
  ('cafe_beverage', 'Cafe & Beverage', 4, true),
  ('snack', 'Snack', 5, true),
  ('dessert', 'Dessert', 6, true),
  ('bakery', 'Bakery', 7, true),
  ('fast_food', 'Fast Food', 8, true),
  ('other', 'Other', 9, true)
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- 2. Places (~20 Hyderabad Iconic Places)
INSERT INTO public.places (id, name, normalized_name, place_type, address, city, country) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Paradise Biryani', 'paradise biryani', 'Restaurant', 'SD Road, Secunderabad', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000102', 'Bawarchi Restaurant', 'bawarchi restaurant', 'Restaurant', 'RTC X Roads', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000103', 'Cafe Niloufer', 'cafe niloufer', 'Cafe', 'Red Hills, Lakdikapul', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000104', 'Nimrah Cafe and Bakery', 'nimrah cafe and bakery', 'Bakery', 'Beside Charminar', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000105', 'Shah Ghouse Hotel', 'shah ghouse hotel', 'Restaurant', 'Tolichowki', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000106', 'Pista House', 'pista house', 'Restaurant', 'Charminar', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000107', 'Chutneys', 'chutneys', 'Restaurant', 'Banjara Hills Road No 3', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000108', 'Govind Ki Bandi', 'govind ki bandi', 'Street Food', 'Ghansi Bazaar', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000109', 'Ram Ki Bandi', 'ram ki bandi', 'Street Food', 'Mozamjahi Market, Nampally', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000110', 'Concu', 'concu', 'Bakery', 'Jubilee Hills Road No 36', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000111', 'Roastery Coffee House', 'roastery coffee house', 'Cafe', 'Banjara Hills Road No 14', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000112', 'Subhan Bakery', 'subhan bakery', 'Bakery', 'Nampally', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000113', 'Karachi Bakery', 'karachi bakery', 'Bakery', 'Mozamjahi Market', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000114', 'Hameedi Confectioners', 'hameedi confectioners', 'Dessert', 'Mozamjahi Market', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000115', 'Fiza Hotel', 'fiza hotel', 'Restaurant', 'Masab Tank', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000116', 'Shadab Hotel', 'shadab hotel', 'Restaurant', 'High Court Road, Ghansi Bazaar', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000117', 'Al Rabea Al Arabi', 'al rabea al arabi', 'Restaurant', 'Santosh Nagar', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000118', 'Gokul Chaat', 'gokul chaat', 'Street Food', 'Koti', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000119', 'Famous Ice Cream', 'famous ice cream', 'Dessert', 'Mozamjahi Market', 'Hyderabad', 'India'),
  ('00000000-0000-0000-0000-000000000120', 'Rayalaseema Ruchulu', 'rayalaseema ruchulu', 'Restaurant', 'Jubilee Hills', 'Hyderabad', 'India')
ON CONFLICT (id) DO NOTHING;

-- 3. Canonical Dishes (~30 Hyderabad Iconic Dishes)
INSERT INTO public.dishes (id, name, normalized_name, slug, cuisine, description) VALUES
  ('00000000-0000-0000-0000-000000000201', 'Hyderabadi Mutton Dum Biryani', 'hyderabadi mutton dum biryani', 'hyderabadi-mutton-dum-biryani', 'Hyderabadi', 'Slow cooked marinated mutton with basmati rice infused with saffron and ghee.'),
  ('00000000-0000-0000-0000-000000000202', 'Hyderabadi Chicken Dum Biryani', 'hyderabadi chicken dum biryani', 'hyderabadi-chicken-dum-biryani', 'Hyderabadi', 'Fragrant layered basmati rice and tender chicken cooked on dum.'),
  ('00000000-0000-0000-0000-000000000203', 'Hyderabadi Haleem', 'hyderabadi haleem', 'hyderabadi-haleem', 'Hyderabadi', 'Traditional meat, lentil, and broken wheat stew slow-cooked with spices.'),
  ('00000000-0000-0000-0000-000000000204', 'Mirchi Ka Salan', 'mirchi ka salan', 'mirchi-ka-salan', 'Hyderabadi', 'Green chillies cooked in a peanut, coconut, and sesame seed curry.'),
  ('00000000-0000-0000-0000-000000000205', 'Double Ka Meetha', 'double ka meetha', 'double-ka-meetha', 'Hyderabadi', 'Golden fried bread pudding soaked in saffron cardamom milk with nuts.'),
  ('00000000-0000-0000-0000-000000000206', 'Qubani Ka Meetha', 'qubani ka meetha', 'qubani-ka-meetha', 'Hyderabadi', 'Stewed dried apricots served with thick cream or custard.'),
  ('00000000-0000-0000-0000-000000000207', 'Irani Chai', 'irani chai', 'irani-chai', 'Hyderabadi', 'Rich, creamy dum-boiled sweet tea served with mawa.'),
  ('00000000-0000-0000-0000-000000000208', 'Osmania Biscuit', 'osmania biscuit', 'osmania-biscuit', 'Bakery', 'Salty-sweet flaky biscuit pairs with Irani chai.'),
  ('00000000-0000-0000-0000-000000000209', 'Tie Biscuit', 'tie biscuit', 'tie-biscuit', 'Bakery', 'Crispy bow-tie shaped puff pastry.'),
  ('00000000-0000-0000-0000-000000000210', 'Butter Dosa', 'butter dosa', 'butter-dosa', 'South Indian', 'Crisp fermented crepe smothered in creamy butter and chutney.'),
  ('00000000-0000-0000-0000-000000000211', 'Ghee Karam Dosa', 'ghee karam dosa', 'ghee-karam-dosa', 'Andhra', 'Spicy red chilli paste and clarified butter layered on crisp dosa.'),
  ('00000000-0000-0000-0000-000000000212', 'MLA Pesarattu', 'mla pesarattu', 'mla-pesarattu', 'Andhra', 'Whole green gram crepe stuffed with savoury upma.'),
  ('00000000-0000-0000-0000-000000000213', 'Tawa Idli', 'tawa idli', 'tawa-idli', 'Street Food', 'Steamed rice cakes tossed on a hot griddle with butter and spicy podi.'),
  ('00000000-0000-0000-0000-000000000214', 'Bheemavaram Kodi Vepudu', 'bheemavaram kodi vepudu', 'bheemavaram-kodi-vepudu', 'Andhra', 'Fiery country chicken fry with crushed black pepper and curry leaves.'),
  ('00000000-0000-0000-0000-000000000215', 'Gongura Mutton', 'gongura mutton', 'gongura-mutton', 'Andhra', 'Tender mutton simmered with tangy sorrel leaves and spices.'),
  ('00000000-0000-0000-0000-000000000216', 'Ulava Charu Biryani', 'ulava charu biryani', 'ulava-charu-biryani', 'Andhra', 'Biryani cooked with traditional horse gram broth reduction.'),
  ('00000000-0000-0000-0000-000000000217', 'Chepala Pulusu', 'chepala pulusu', 'chepala-pulusu', 'Andhra', 'Clay pot fish curry cooked in a tangy tamarind gravy.'),
  ('00000000-0000-0000-0000-000000000218', 'Paya Shorba', 'paya shorba', 'paya-shorba', 'Mughlai', 'Slow-cooked lamb trotters broth with aromatics.'),
  ('00000000-0000-0000-0000-000000000219', 'Nalli Nihari', 'nalli nihari', 'nalli-nihari', 'Mughlai', 'Shank meat stew slow-cooked overnight with bone marrow.'),
  ('00000000-0000-0000-0000-000000000220', 'Sheermal', 'sheermal', 'sheermal', 'Awadhi', 'Saffron-flavored traditional flatbread.'),
  ('00000000-0000-0000-0000-000000000221', 'Mandi Mutton', 'mandi mutton', 'mandi-mutton', 'Arabian', 'Yemeni spiced rice served with tender braised lamb shank.'),
  ('00000000-0000-0000-0000-000000000222', 'Baghara Baingan', 'baghara baingan', 'baghara-baingan', 'Hyderabadi', 'Tempered baby eggplants cooked in a rich sesame-peanut gravy.'),
  ('00000000-0000-0000-0000-000000000223', 'Khatti Dal', 'khatti dal', 'khatti-dal', 'Hyderabadi', 'Yellow lentils simmered with tamarind pulp, garlic, and cumin.'),
  ('00000000-0000-0000-0000-000000000224', 'Tala Hua Gosht', 'tala hua gosht', 'tala-hua-gosht', 'Hyderabadi', 'Crispy fried boneless spiced beef or mutton cubes.'),
  ('00000000-0000-0000-0000-000000000225', 'Jouzi Halwa', 'jouzi halwa', 'jouzi-halwa', 'Dessert', 'Century-old Turkish sweet made with milk, dry fruits, and zafran.'),
  ('00000000-0000-0000-0000-000000000226', 'Fruit Biscuit', 'fruit biscuit', 'fruit-biscuit', 'Bakery', 'Famous candied fruit cookies.'),
  ('00000000-0000-0000-0000-000000000227', 'Badaam Ki Jali', 'badaam ki jali', 'badaam-ki-jali', 'Dessert', 'Almond paste confectionery shaped into floral fretwork.'),
  ('00000000-0000-0000-0000-000000000228', 'Dahi Vada', 'dahi vada', 'dahi-vada', 'Street Food', 'Lentil fritters soaked in spiced yoghurt tempered with mustard seeds.'),
  ('00000000-0000-0000-0000-000000000229', 'Samosa Chaat', 'samosa chaat', 'samosa-chaat', 'Street Food', 'Crushed potato samosa smothered in chole, sev, and tangy chutneys.'),
  ('00000000-0000-0000-0000-000000000230', 'Filter Coffee', 'filter coffee', 'filter-coffee', 'South Indian', 'Traditional chicory blended decoction with frothy frothed milk.')
ON CONFLICT (id) DO NOTHING;

-- 4. Dish Aliases
INSERT INTO public.dish_aliases (dish_id, alias, normalized_alias) VALUES
  ('00000000-0000-0000-0000-000000000201', 'Mutton Biryani', 'mutton biryani'),
  ('00000000-0000-0000-0000-000000000201', 'Gosht Dum Biryani', 'gosht dum biryani'),
  ('00000000-0000-0000-0000-000000000202', 'Chicken Biryani', 'chicken biryani'),
  ('00000000-0000-0000-0000-000000000203', 'Hyderabadi Dalcha Haleem', 'hyderabadi dalcha haleem'),
  ('00000000-0000-0000-0000-000000000207', 'Chai', 'chai'),
  ('00000000-0000-0000-0000-000000000211', 'Karam Dosa', 'karam dosa'),
  ('00000000-0000-0000-0000-000000000224', 'Tala Ghost', 'tala ghost')
ON CONFLICT DO NOTHING;
