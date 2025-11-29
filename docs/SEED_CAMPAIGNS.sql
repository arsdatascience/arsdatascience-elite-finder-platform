-- Script de Seed para Campanhas
BEGIN;


    INSERT INTO clients (name, type, industry) 
    VALUES ('TechSolutions Ltda', 'Technology', 'SaaS')
    ON CONFLICT (name) DO NOTHING;
    
    INSERT INTO clients (name, type, industry) 
    VALUES ('Dr. Silva Odontologia', 'Health', 'Dental')
    ON CONFLICT (name) DO NOTHING;
    
    INSERT INTO clients (name, type, industry) 
    VALUES ('Moda & Estilo', 'Retail', 'Fashion')
    ON CONFLICT (name) DO NOTHING;
    
            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Search - Institucional - 2025', 'google', 'active', 4089, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 1238, 21, 50.66, 0, 325.08),
                    ((SELECT id FROM new_campaign), '2025-10-31', 1858, 33, 75.50, 1, 391.29),
                    ((SELECT id FROM new_campaign), '2025-11-01', 391, 4, 10.66, 0, 27.58),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1919, 52, 119.93, 1, 485.61),
                    ((SELECT id FROM new_campaign), '2025-11-03', 1302, 39, 99.28, 1, 718.23),
                    ((SELECT id FROM new_campaign), '2025-11-04', 2620, 46, 124.99, 1, 423.76),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1134, 12, 32.13, 0, 209.12),
                    ((SELECT id FROM new_campaign), '2025-11-06', 452, 2, 4.65, 0, 35.21),
                    ((SELECT id FROM new_campaign), '2025-11-07', 467, 3, 7.37, 0, 23.66),
                    ((SELECT id FROM new_campaign), '2025-11-08', 1561, 32, 75.94, 0, 580.51),
                    ((SELECT id FROM new_campaign), '2025-11-09', 949, 8, 20.48, 0, 127.77),
                    ((SELECT id FROM new_campaign), '2025-11-10', 1329, 39, 94.55, 1, 623.51),
                    ((SELECT id FROM new_campaign), '2025-11-11', 581, 9, 23.93, 0, 178.95),
                    ((SELECT id FROM new_campaign), '2025-11-12', 2797, 53, 135.07, 1, 910.36),
                    ((SELECT id FROM new_campaign), '2025-11-13', 2249, 12, 32.47, 0, 212.10),
                    ((SELECT id FROM new_campaign), '2025-11-14', 858, 18, 44.04, 0, 275.67),
                    ((SELECT id FROM new_campaign), '2025-11-15', 1959, 50, 131.22, 1, 961.16),
                    ((SELECT id FROM new_campaign), '2025-11-16', 363, 2, 5.43, 0, 36.52),
                    ((SELECT id FROM new_campaign), '2025-11-17', 1767, 14, 36.95, 0, 171.98),
                    ((SELECT id FROM new_campaign), '2025-11-18', 1077, 29, 71.61, 1, 521.91),
                    ((SELECT id FROM new_campaign), '2025-11-19', 791, 20, 45.87, 0, 319.08),
                    ((SELECT id FROM new_campaign), '2025-11-20', 654, 17, 41.36, 0, 148.07),
                    ((SELECT id FROM new_campaign), '2025-11-21', 1320, 7, 18.57, 0, 38.32),
                    ((SELECT id FROM new_campaign), '2025-11-22', 2065, 47, 129.08, 1, 403.86),
                    ((SELECT id FROM new_campaign), '2025-11-23', 949, 15, 35.03, 0, 94.12),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1748, 13, 31.68, 0, 172.71),
                    ((SELECT id FROM new_campaign), '2025-11-25', 2292, 62, 142.01, 2, 595.14),
                    ((SELECT id FROM new_campaign), '2025-11-26', 2043, 41, 105.89, 1, 773.09),
                    ((SELECT id FROM new_campaign), '2025-11-27', 1246, 32, 74.88, 1, 175.52),
                    ((SELECT id FROM new_campaign), '2025-11-28', 744, 5, 11.42, 0, 44.57),
                    ((SELECT id FROM new_campaign), '2025-11-29', 926, 13, 33.81, 0, 80.44)
                )
                
            UPDATE campaigns 
            SET spent = 1866.46, conversions = 13, ctr = 1.80, roas = 5.40
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Search - Competidores - 2025', 'google', 'active', 2393, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 905, 7, 15.94, 0, 63.89),
                    ((SELECT id FROM new_campaign), '2025-10-31', 1254, 11, 25.33, 0, 90.98),
                    ((SELECT id FROM new_campaign), '2025-11-01', 618, 18, 41.05, 0, 92.71),
                    ((SELECT id FROM new_campaign), '2025-11-02', 522, 15, 39.95, 0, 282.34),
                    ((SELECT id FROM new_campaign), '2025-11-03', 339, 7, 17.77, 0, 111.59),
                    ((SELECT id FROM new_campaign), '2025-11-04', 1833, 28, 63.90, 1, 192.22),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1569, 44, 100.12, 1, 403.96),
                    ((SELECT id FROM new_campaign), '2025-11-06', 1507, 25, 56.62, 0, 261.25),
                    ((SELECT id FROM new_campaign), '2025-11-07', 1477, 34, 87.85, 1, 346.32),
                    ((SELECT id FROM new_campaign), '2025-11-08', 579, 3, 7.93, 0, 58.38),
                    ((SELECT id FROM new_campaign), '2025-11-09', 509, 13, 34.20, 0, 142.02),
                    ((SELECT id FROM new_campaign), '2025-11-10', 1061, 29, 73.64, 0, 256.09),
                    ((SELECT id FROM new_campaign), '2025-11-11', 1083, 20, 45.51, 0, 235.05),
                    ((SELECT id FROM new_campaign), '2025-11-12', 2258, 36, 89.28, 1, 180.69),
                    ((SELECT id FROM new_campaign), '2025-11-13', 983, 7, 19.03, 0, 57.03),
                    ((SELECT id FROM new_campaign), '2025-11-14', 754, 12, 28.72, 0, 182.66),
                    ((SELECT id FROM new_campaign), '2025-11-15', 984, 17, 44.97, 0, 123.83),
                    ((SELECT id FROM new_campaign), '2025-11-16', 1506, 31, 73.58, 0, 389.86),
                    ((SELECT id FROM new_campaign), '2025-11-17', 831, 21, 49.24, 0, 115.83),
                    ((SELECT id FROM new_campaign), '2025-11-18', 2259, 24, 59.13, 1, 225.19),
                    ((SELECT id FROM new_campaign), '2025-11-19', 2513, 64, 152.71, 2, 966.06),
                    ((SELECT id FROM new_campaign), '2025-11-20', 1948, 16, 37.11, 0, 98.89),
                    ((SELECT id FROM new_campaign), '2025-11-21', 1634, 17, 40.67, 0, 224.67),
                    ((SELECT id FROM new_campaign), '2025-11-22', 2204, 38, 104.20, 0, 287.21),
                    ((SELECT id FROM new_campaign), '2025-11-23', 1632, 47, 120.91, 2, 582.69),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1655, 49, 110.71, 1, 514.26),
                    ((SELECT id FROM new_campaign), '2025-11-25', 1854, 21, 49.90, 0, 329.55),
                    ((SELECT id FROM new_campaign), '2025-11-26', 2492, 34, 88.35, 0, 582.35),
                    ((SELECT id FROM new_campaign), '2025-11-27', 1501, 37, 96.74, 1, 462.86),
                    ((SELECT id FROM new_campaign), '2025-11-28', 2020, 22, 53.01, 0, 282.57),
                    ((SELECT id FROM new_campaign), '2025-11-29', 983, 17, 44.90, 0, 137.52)
                )
                
            UPDATE campaigns 
            SET spent = 1872.96, conversions = 11, ctr = 1.77, roas = 4.42
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Feed - Awareness - 2025', 'meta', 'active', 3463, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 4607, 114, 86.56, 1, 140.26),
                    ((SELECT id FROM new_campaign), '2025-10-31', 5542, 156, 130.79, 3, 682.54),
                    ((SELECT id FROM new_campaign), '2025-11-01', 4350, 120, 91.72, 1, 409.78),
                    ((SELECT id FROM new_campaign), '2025-11-02', 10766, 181, 134.94, 3, 408.18),
                    ((SELECT id FROM new_campaign), '2025-11-03', 5309, 101, 82.19, 2, 357.70),
                    ((SELECT id FROM new_campaign), '2025-11-04', 10542, 62, 49.31, 1, 102.92),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1802, 21, 17.09, 0, 96.84),
                    ((SELECT id FROM new_campaign), '2025-11-06', 7700, 189, 154.39, 3, 602.67),
                    ((SELECT id FROM new_campaign), '2025-11-07', 7353, 74, 53.97, 1, 143.63),
                    ((SELECT id FROM new_campaign), '2025-11-08', 6333, 37, 29.19, 0, 113.99),
                    ((SELECT id FROM new_campaign), '2025-11-09', 7241, 154, 124.53, 2, 188.94),
                    ((SELECT id FROM new_campaign), '2025-11-10', 10484, 63, 54.64, 1, 244.86),
                    ((SELECT id FROM new_campaign), '2025-11-11', 7370, 135, 97.73, 2, 585.48),
                    ((SELECT id FROM new_campaign), '2025-11-12', 10796, 94, 78.67, 1, 409.07),
                    ((SELECT id FROM new_campaign), '2025-11-13', 7547, 158, 128.19, 3, 201.65),
                    ((SELECT id FROM new_campaign), '2025-11-14', 2402, 30, 23.87, 0, 70.25),
                    ((SELECT id FROM new_campaign), '2025-11-15', 2305, 42, 31.20, 0, 140.01),
                    ((SELECT id FROM new_campaign), '2025-11-16', 1883, 32, 25.54, 0, 77.43),
                    ((SELECT id FROM new_campaign), '2025-11-17', 8853, 88, 71.40, 1, 394.95),
                    ((SELECT id FROM new_campaign), '2025-11-18', 8779, 85, 69.81, 1, 332.38),
                    ((SELECT id FROM new_campaign), '2025-11-19', 3357, 62, 45.62, 1, 104.29),
                    ((SELECT id FROM new_campaign), '2025-11-20', 9886, 51, 41.93, 1, 157.37),
                    ((SELECT id FROM new_campaign), '2025-11-21', 11145, 79, 69.25, 1, 274.62),
                    ((SELECT id FROM new_campaign), '2025-11-22', 9052, 96, 75.44, 1, 173.66),
                    ((SELECT id FROM new_campaign), '2025-11-23', 4572, 95, 68.88, 1, 245.21),
                    ((SELECT id FROM new_campaign), '2025-11-24', 3580, 87, 76.47, 1, 177.82),
                    ((SELECT id FROM new_campaign), '2025-11-25', 3696, 75, 61.60, 1, 130.76),
                    ((SELECT id FROM new_campaign), '2025-11-26', 3960, 113, 85.07, 1, 351.81),
                    ((SELECT id FROM new_campaign), '2025-11-27', 11138, 307, 224.04, 4, 771.69),
                    ((SELECT id FROM new_campaign), '2025-11-28', 5421, 110, 93.56, 1, 265.68),
                    ((SELECT id FROM new_campaign), '2025-11-29', 6466, 181, 159.28, 3, 310.83)
                )
                
            UPDATE campaigns 
            SET spent = 2536.87, conversions = 42, ctr = 1.56, roas = 3.42
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Stories - Conversão - 2025', 'meta', 'active', 2744, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 2907, 70, 56.04, 1, 229.59),
                    ((SELECT id FROM new_campaign), '2025-10-31', 5259, 105, 76.42, 2, 139.85),
                    ((SELECT id FROM new_campaign), '2025-11-01', 3039, 74, 64.19, 0, 204.80),
                    ((SELECT id FROM new_campaign), '2025-11-02', 5914, 173, 128.69, 3, 505.15),
                    ((SELECT id FROM new_campaign), '2025-11-03', 10337, 95, 68.70, 1, 374.00),
                    ((SELECT id FROM new_campaign), '2025-11-04', 7528, 43, 34.79, 0, 80.24),
                    ((SELECT id FROM new_campaign), '2025-11-05', 2279, 35, 30.28, 0, 71.73),
                    ((SELECT id FROM new_campaign), '2025-11-06', 9777, 260, 187.31, 3, 848.29),
                    ((SELECT id FROM new_campaign), '2025-11-07', 10015, 126, 103.66, 1, 196.46),
                    ((SELECT id FROM new_campaign), '2025-11-08', 3610, 69, 50.47, 1, 118.37),
                    ((SELECT id FROM new_campaign), '2025-11-09', 4776, 142, 119.53, 2, 213.52),
                    ((SELECT id FROM new_campaign), '2025-11-10', 4611, 119, 102.63, 2, 430.00),
                    ((SELECT id FROM new_campaign), '2025-11-11', 3541, 46, 36.73, 0, 159.20),
                    ((SELECT id FROM new_campaign), '2025-11-12', 10153, 226, 193.75, 4, 480.58),
                    ((SELECT id FROM new_campaign), '2025-11-13', 4354, 81, 61.76, 1, 128.81),
                    ((SELECT id FROM new_campaign), '2025-11-14', 3996, 28, 20.37, 0, 118.47),
                    ((SELECT id FROM new_campaign), '2025-11-15', 5397, 139, 106.42, 1, 545.50),
                    ((SELECT id FROM new_campaign), '2025-11-16', 3537, 100, 74.02, 1, 200.73),
                    ((SELECT id FROM new_campaign), '2025-11-17', 8124, 192, 144.12, 3, 408.16),
                    ((SELECT id FROM new_campaign), '2025-11-18', 7733, 152, 111.20, 2, 594.52),
                    ((SELECT id FROM new_campaign), '2025-11-19', 8012, 196, 144.75, 4, 829.73),
                    ((SELECT id FROM new_campaign), '2025-11-20', 4210, 123, 91.00, 1, 235.96),
                    ((SELECT id FROM new_campaign), '2025-11-21', 4183, 108, 83.67, 1, 383.86),
                    ((SELECT id FROM new_campaign), '2025-11-22', 6632, 83, 66.42, 1, 159.45),
                    ((SELECT id FROM new_campaign), '2025-11-23', 8555, 49, 38.58, 0, 214.37),
                    ((SELECT id FROM new_campaign), '2025-11-24', 5585, 85, 72.89, 1, 421.49),
                    ((SELECT id FROM new_campaign), '2025-11-25', 5076, 93, 71.97, 1, 223.13),
                    ((SELECT id FROM new_campaign), '2025-11-26', 7957, 40, 28.93, 0, 151.81),
                    ((SELECT id FROM new_campaign), '2025-11-27', 2516, 40, 30.34, 0, 79.37),
                    ((SELECT id FROM new_campaign), '2025-11-28', 10328, 280, 242.04, 5, 1305.04),
                    ((SELECT id FROM new_campaign), '2025-11-29', 10260, 76, 59.27, 1, 224.57)
                )
                
            UPDATE campaigns 
            SET spent = 2700.96, conversions = 43, ctr = 1.81, roas = 3.80
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'TrueView - Brand Lift - 2025', 'youtube', 'active', 1028, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 19406, 295, 44.81, 1, 75.85),
                    ((SELECT id FROM new_campaign), '2025-10-31', 15356, 425, 65.06, 3, 240.92),
                    ((SELECT id FROM new_campaign), '2025-11-01', 9555, 131, 19.32, 0, 71.85),
                    ((SELECT id FROM new_campaign), '2025-11-02', 11775, 133, 21.65, 0, 75.72),
                    ((SELECT id FROM new_campaign), '2025-11-03', 5710, 33, 4.65, 0, 8.55),
                    ((SELECT id FROM new_campaign), '2025-11-04', 12000, 337, 45.54, 2, 78.68),
                    ((SELECT id FROM new_campaign), '2025-11-05', 13874, 80, 12.79, 0, 37.42),
                    ((SELECT id FROM new_campaign), '2025-11-06', 4942, 101, 15.46, 0, 29.08),
                    ((SELECT id FROM new_campaign), '2025-11-07', 24346, 484, 78.34, 2, 156.61),
                    ((SELECT id FROM new_campaign), '2025-11-08', 5132, 79, 10.98, 0, 18.08),
                    ((SELECT id FROM new_campaign), '2025-11-09', 19630, 183, 26.91, 0, 45.20),
                    ((SELECT id FROM new_campaign), '2025-11-10', 7947, 116, 17.80, 0, 39.38),
                    ((SELECT id FROM new_campaign), '2025-11-11', 22799, 629, 95.02, 3, 170.23),
                    ((SELECT id FROM new_campaign), '2025-11-12', 16338, 169, 24.26, 1, 43.77),
                    ((SELECT id FROM new_campaign), '2025-11-13', 17312, 178, 24.84, 0, 74.55),
                    ((SELECT id FROM new_campaign), '2025-11-14', 21160, 546, 87.79, 3, 96.64),
                    ((SELECT id FROM new_campaign), '2025-11-15', 6509, 79, 12.47, 0, 22.34),
                    ((SELECT id FROM new_campaign), '2025-11-16', 17272, 164, 26.56, 1, 81.33),
                    ((SELECT id FROM new_campaign), '2025-11-17', 12029, 264, 38.62, 1, 70.57),
                    ((SELECT id FROM new_campaign), '2025-11-18', 6449, 191, 31.20, 1, 98.88),
                    ((SELECT id FROM new_campaign), '2025-11-19', 7697, 83, 12.25, 0, 20.50),
                    ((SELECT id FROM new_campaign), '2025-11-20', 23876, 474, 73.85, 2, 79.95),
                    ((SELECT id FROM new_campaign), '2025-11-21', 9528, 150, 21.14, 0, 63.96),
                    ((SELECT id FROM new_campaign), '2025-11-22', 18103, 446, 72.67, 2, 275.20),
                    ((SELECT id FROM new_campaign), '2025-11-23', 20838, 598, 84.16, 2, 248.27),
                    ((SELECT id FROM new_campaign), '2025-11-24', 11366, 257, 39.24, 1, 97.35),
                    ((SELECT id FROM new_campaign), '2025-11-25', 17411, 240, 36.14, 1, 38.97),
                    ((SELECT id FROM new_campaign), '2025-11-26', 17344, 297, 43.91, 1, 82.68),
                    ((SELECT id FROM new_campaign), '2025-11-27', 6590, 102, 15.02, 0, 39.35),
                    ((SELECT id FROM new_campaign), '2025-11-28', 14004, 203, 27.88, 0, 76.94),
                    ((SELECT id FROM new_campaign), '2025-11-29', 24350, 370, 50.25, 2, 88.62)
                )
                
            UPDATE campaigns 
            SET spent = 1180.59, conversions = 29, ctr = 1.78, roas = 2.24
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Bumper Ads - Reach - 2025', 'youtube', 'active', 2231, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 3404, 29, 4.57, 0, 7.34),
                    ((SELECT id FROM new_campaign), '2025-10-31', 8296, 41, 5.72, 0, 7.98),
                    ((SELECT id FROM new_campaign), '2025-11-01', 22411, 491, 77.03, 2, 145.59),
                    ((SELECT id FROM new_campaign), '2025-11-02', 12362, 357, 56.30, 2, 77.55),
                    ((SELECT id FROM new_campaign), '2025-11-03', 10976, 168, 27.04, 0, 108.07),
                    ((SELECT id FROM new_campaign), '2025-11-04', 21092, 538, 84.09, 2, 121.21),
                    ((SELECT id FROM new_campaign), '2025-11-05', 6905, 75, 11.40, 0, 26.28),
                    ((SELECT id FROM new_campaign), '2025-11-06', 14612, 168, 23.46, 0, 82.72),
                    ((SELECT id FROM new_campaign), '2025-11-07', 12625, 89, 14.27, 0, 51.60),
                    ((SELECT id FROM new_campaign), '2025-11-08', 12350, 275, 43.29, 1, 157.86),
                    ((SELECT id FROM new_campaign), '2025-11-09', 12296, 336, 54.51, 2, 61.99),
                    ((SELECT id FROM new_campaign), '2025-11-10', 18156, 346, 49.26, 2, 85.68),
                    ((SELECT id FROM new_campaign), '2025-11-11', 4828, 29, 4.70, 0, 7.29),
                    ((SELECT id FROM new_campaign), '2025-11-12', 26578, 369, 52.05, 2, 116.67),
                    ((SELECT id FROM new_campaign), '2025-11-13', 5906, 33, 5.10, 0, 19.62),
                    ((SELECT id FROM new_campaign), '2025-11-14', 29083, 430, 67.20, 2, 168.63),
                    ((SELECT id FROM new_campaign), '2025-11-15', 5562, 141, 20.33, 0, 70.03),
                    ((SELECT id FROM new_campaign), '2025-11-16', 28254, 639, 103.02, 4, 170.98),
                    ((SELECT id FROM new_campaign), '2025-11-17', 26187, 642, 94.05, 4, 159.74),
                    ((SELECT id FROM new_campaign), '2025-11-18', 7544, 104, 15.84, 0, 48.27),
                    ((SELECT id FROM new_campaign), '2025-11-19', 13796, 314, 44.90, 1, 145.89),
                    ((SELECT id FROM new_campaign), '2025-11-20', 13003, 337, 45.67, 2, 99.25),
                    ((SELECT id FROM new_campaign), '2025-11-21', 10068, 109, 16.81, 0, 65.67),
                    ((SELECT id FROM new_campaign), '2025-11-22', 7389, 78, 11.55, 0, 19.53),
                    ((SELECT id FROM new_campaign), '2025-11-23', 18675, 387, 55.88, 1, 144.10),
                    ((SELECT id FROM new_campaign), '2025-11-24', 17394, 293, 47.21, 1, 185.24),
                    ((SELECT id FROM new_campaign), '2025-11-25', 7485, 217, 34.39, 1, 119.91),
                    ((SELECT id FROM new_campaign), '2025-11-26', 7701, 152, 24.27, 1, 37.85),
                    ((SELECT id FROM new_campaign), '2025-11-27', 5835, 90, 14.24, 0, 52.86),
                    ((SELECT id FROM new_campaign), '2025-11-28', 18113, 381, 58.29, 2, 165.20),
                    ((SELECT id FROM new_campaign), '2025-11-29', 23169, 512, 73.25, 3, 120.51)
                )
                
            UPDATE campaigns 
            SET spent = 1239.70, conversions = 35, ctr = 1.89, roas = 2.30
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Sponsored Content - B2B - 2025', 'linkedin', 'active', 2247, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 152, 3, 45.94, 0, 76.53),
                    ((SELECT id FROM new_campaign), '2025-10-31', 787, 5, 69.25, 0, 300.49),
                    ((SELECT id FROM new_campaign), '2025-11-01', 477, 6, 97.30, 0, 261.76),
                    ((SELECT id FROM new_campaign), '2025-11-02', 515, 14, 192.73, 0, 332.88),
                    ((SELECT id FROM new_campaign), '2025-11-03', 488, 11, 151.97, 0, 422.21),
                    ((SELECT id FROM new_campaign), '2025-11-04', 388, 10, 158.81, 0, 598.29),
                    ((SELECT id FROM new_campaign), '2025-11-05', 465, 6, 96.57, 0, 166.66),
                    ((SELECT id FROM new_campaign), '2025-11-06', 572, 12, 185.46, 0, 459.15),
                    ((SELECT id FROM new_campaign), '2025-11-07', 921, 4, 63.13, 0, 303.61),
                    ((SELECT id FROM new_campaign), '2025-11-08', 393, 3, 44.82, 0, 99.19),
                    ((SELECT id FROM new_campaign), '2025-11-09', 647, 5, 74.65, 0, 105.24),
                    ((SELECT id FROM new_campaign), '2025-11-10', 337, 2, 28.63, 0, 90.91),
                    ((SELECT id FROM new_campaign), '2025-11-11', 373, 5, 71.49, 0, 191.31),
                    ((SELECT id FROM new_campaign), '2025-11-12', 548, 8, 125.91, 0, 362.98),
                    ((SELECT id FROM new_campaign), '2025-11-13', 947, 10, 158.67, 0, 758.59),
                    ((SELECT id FROM new_campaign), '2025-11-14', 401, 6, 83.73, 0, 406.90),
                    ((SELECT id FROM new_campaign), '2025-11-15', 655, 13, 176.07, 0, 503.75),
                    ((SELECT id FROM new_campaign), '2025-11-16', 174, 3, 43.67, 0, 167.34),
                    ((SELECT id FROM new_campaign), '2025-11-17', 626, 6, 82.25, 0, 298.41),
                    ((SELECT id FROM new_campaign), '2025-11-18', 495, 11, 170.31, 0, 484.29),
                    ((SELECT id FROM new_campaign), '2025-11-19', 380, 9, 141.93, 0, 234.76),
                    ((SELECT id FROM new_campaign), '2025-11-20', 550, 9, 129.79, 0, 528.24),
                    ((SELECT id FROM new_campaign), '2025-11-21', 525, 12, 179.10, 0, 398.03),
                    ((SELECT id FROM new_campaign), '2025-11-22', 465, 12, 168.75, 0, 418.45),
                    ((SELECT id FROM new_campaign), '2025-11-23', 786, 11, 161.37, 0, 324.57),
                    ((SELECT id FROM new_campaign), '2025-11-24', 478, 10, 150.62, 0, 496.43),
                    ((SELECT id FROM new_campaign), '2025-11-25', 409, 8, 125.02, 0, 495.65),
                    ((SELECT id FROM new_campaign), '2025-11-26', 160, 2, 30.20, 0, 101.68),
                    ((SELECT id FROM new_campaign), '2025-11-27', 406, 7, 99.11, 0, 383.95),
                    ((SELECT id FROM new_campaign), '2025-11-28', 305, 5, 70.18, 0, 135.08),
                    ((SELECT id FROM new_campaign), '2025-11-29', 677, 6, 83.28, 0, 332.98)
                )
                
            UPDATE campaigns 
            SET spent = 3460.74, conversions = 0, ctr = 1.51, roas = 2.96
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'InMail - Decision Makers - 2025', 'linkedin', 'active', 2636, 0, 0, 0, 0
                FROM clients WHERE name = 'TechSolutions Ltda'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 600, 13, 213.18, 0, 625.00),
                    ((SELECT id FROM new_campaign), '2025-10-31', 904, 9, 128.66, 0, 234.31),
                    ((SELECT id FROM new_campaign), '2025-11-01', 221, 3, 46.00, 0, 214.66),
                    ((SELECT id FROM new_campaign), '2025-11-02', 662, 7, 100.37, 0, 168.52),
                    ((SELECT id FROM new_campaign), '2025-11-03', 485, 14, 224.53, 0, 1041.49),
                    ((SELECT id FROM new_campaign), '2025-11-04', 1110, 20, 274.10, 0, 1136.86),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1052, 24, 392.93, 1, 511.62),
                    ((SELECT id FROM new_campaign), '2025-11-06', 1151, 10, 152.85, 0, 522.45),
                    ((SELECT id FROM new_campaign), '2025-11-07', 845, 14, 206.96, 0, 689.90),
                    ((SELECT id FROM new_campaign), '2025-11-08', 856, 5, 68.01, 0, 279.17),
                    ((SELECT id FROM new_campaign), '2025-11-09', 923, 4, 61.90, 0, 119.67),
                    ((SELECT id FROM new_campaign), '2025-11-10', 254, 2, 27.69, 0, 132.25),
                    ((SELECT id FROM new_campaign), '2025-11-11', 725, 14, 210.43, 0, 581.95),
                    ((SELECT id FROM new_campaign), '2025-11-12', 160, 1, 15.65, 0, 50.76),
                    ((SELECT id FROM new_campaign), '2025-11-13', 281, 4, 58.73, 0, 167.33),
                    ((SELECT id FROM new_campaign), '2025-11-14', 756, 4, 59.51, 0, 251.89),
                    ((SELECT id FROM new_campaign), '2025-11-15', 592, 4, 64.54, 0, 245.33),
                    ((SELECT id FROM new_campaign), '2025-11-16', 521, 3, 46.98, 0, 195.74),
                    ((SELECT id FROM new_campaign), '2025-11-17', 534, 10, 153.87, 0, 705.34),
                    ((SELECT id FROM new_campaign), '2025-11-18', 729, 7, 107.14, 0, 372.12),
                    ((SELECT id FROM new_campaign), '2025-11-19', 939, 14, 202.51, 0, 539.34),
                    ((SELECT id FROM new_campaign), '2025-11-20', 481, 6, 91.64, 0, 364.23),
                    ((SELECT id FROM new_campaign), '2025-11-21', 909, 24, 373.78, 1, 1210.59),
                    ((SELECT id FROM new_campaign), '2025-11-22', 717, 21, 291.61, 1, 1263.57),
                    ((SELECT id FROM new_campaign), '2025-11-23', 748, 4, 61.17, 0, 232.39),
                    ((SELECT id FROM new_campaign), '2025-11-24', 622, 3, 44.11, 0, 80.86),
                    ((SELECT id FROM new_campaign), '2025-11-25', 445, 5, 76.81, 0, 145.04),
                    ((SELECT id FROM new_campaign), '2025-11-26', 647, 15, 229.71, 0, 322.27),
                    ((SELECT id FROM new_campaign), '2025-11-27', 614, 13, 194.75, 0, 800.48),
                    ((SELECT id FROM new_campaign), '2025-11-28', 1179, 21, 289.66, 1, 1100.69),
                    ((SELECT id FROM new_campaign), '2025-11-29', 989, 26, 407.50, 1, 1810.03)
                )
                
            UPDATE campaigns 
            SET spent = 4877.27, conversions = 5, ctr = 1.50, roas = 3.30
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Search - Institucional - 2025', 'google', 'active', 2034, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 2043, 59, 142.20, 1, 701.87),
                    ((SELECT id FROM new_campaign), '2025-10-31', 2150, 31, 72.31, 0, 270.72),
                    ((SELECT id FROM new_campaign), '2025-11-01', 1180, 28, 66.35, 1, 367.20),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1002, 13, 31.65, 0, 238.12),
                    ((SELECT id FROM new_campaign), '2025-11-03', 545, 3, 7.50, 0, 26.43),
                    ((SELECT id FROM new_campaign), '2025-11-04', 1596, 34, 81.35, 1, 210.59),
                    ((SELECT id FROM new_campaign), '2025-11-05', 716, 6, 15.82, 0, 88.90),
                    ((SELECT id FROM new_campaign), '2025-11-06', 857, 22, 51.34, 0, 303.75),
                    ((SELECT id FROM new_campaign), '2025-11-07', 812, 8, 21.56, 0, 115.31),
                    ((SELECT id FROM new_campaign), '2025-11-08', 2144, 52, 123.24, 1, 697.84),
                    ((SELECT id FROM new_campaign), '2025-11-09', 1235, 12, 31.15, 0, 65.36),
                    ((SELECT id FROM new_campaign), '2025-11-10', 1520, 34, 92.22, 1, 651.86),
                    ((SELECT id FROM new_campaign), '2025-11-11', 687, 19, 46.42, 0, 314.85),
                    ((SELECT id FROM new_campaign), '2025-11-12', 2386, 35, 92.90, 1, 696.70),
                    ((SELECT id FROM new_campaign), '2025-11-13', 2495, 16, 42.00, 0, 246.23),
                    ((SELECT id FROM new_campaign), '2025-11-14', 1386, 26, 61.00, 0, 292.51),
                    ((SELECT id FROM new_campaign), '2025-11-15', 1852, 41, 96.55, 1, 445.56),
                    ((SELECT id FROM new_campaign), '2025-11-16', 1913, 40, 97.58, 1, 276.25),
                    ((SELECT id FROM new_campaign), '2025-11-17', 1963, 49, 115.79, 1, 294.81),
                    ((SELECT id FROM new_campaign), '2025-11-18', 1709, 45, 123.14, 1, 963.66),
                    ((SELECT id FROM new_campaign), '2025-11-19', 1113, 16, 37.12, 0, 207.14),
                    ((SELECT id FROM new_campaign), '2025-11-20', 523, 11, 28.94, 0, 195.57),
                    ((SELECT id FROM new_campaign), '2025-11-21', 2254, 51, 134.81, 1, 847.84),
                    ((SELECT id FROM new_campaign), '2025-11-22', 2760, 38, 94.65, 1, 366.99),
                    ((SELECT id FROM new_campaign), '2025-11-23', 1288, 12, 30.05, 0, 111.47),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1131, 29, 77.54, 1, 193.21),
                    ((SELECT id FROM new_campaign), '2025-11-25', 1587, 15, 34.01, 0, 201.75),
                    ((SELECT id FROM new_campaign), '2025-11-26', 1555, 34, 86.69, 1, 357.56),
                    ((SELECT id FROM new_campaign), '2025-11-27', 1688, 34, 90.33, 1, 639.00),
                    ((SELECT id FROM new_campaign), '2025-11-28', 1736, 14, 35.56, 0, 157.76),
                    ((SELECT id FROM new_campaign), '2025-11-29', 1240, 14, 34.16, 0, 253.33)
                )
                
            UPDATE campaigns 
            SET spent = 2095.95, conversions = 15, ctr = 1.79, roas = 5.15
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Search - Competidores - 2025', 'google', 'active', 1305, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 1145, 28, 76.43, 0, 442.46),
                    ((SELECT id FROM new_campaign), '2025-10-31', 442, 5, 12.56, 0, 60.49),
                    ((SELECT id FROM new_campaign), '2025-11-01', 608, 17, 46.32, 0, 265.28),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1147, 20, 54.96, 0, 375.65),
                    ((SELECT id FROM new_campaign), '2025-11-03', 2868, 36, 97.18, 1, 204.60),
                    ((SELECT id FROM new_campaign), '2025-11-04', 1242, 20, 46.27, 0, 254.22),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1526, 40, 90.91, 1, 712.90),
                    ((SELECT id FROM new_campaign), '2025-11-06', 1797, 18, 44.46, 0, 94.71),
                    ((SELECT id FROM new_campaign), '2025-11-07', 1277, 25, 65.86, 0, 371.96),
                    ((SELECT id FROM new_campaign), '2025-11-08', 2550, 66, 178.74, 1, 1075.89),
                    ((SELECT id FROM new_campaign), '2025-11-09', 471, 8, 20.50, 0, 67.37),
                    ((SELECT id FROM new_campaign), '2025-11-10', 1772, 28, 70.77, 0, 480.27),
                    ((SELECT id FROM new_campaign), '2025-11-11', 1186, 29, 70.72, 0, 449.27),
                    ((SELECT id FROM new_campaign), '2025-11-12', 2073, 22, 57.62, 0, 417.92),
                    ((SELECT id FROM new_campaign), '2025-11-13', 1277, 12, 29.68, 0, 143.61),
                    ((SELECT id FROM new_campaign), '2025-11-14', 1805, 46, 117.80, 1, 321.19),
                    ((SELECT id FROM new_campaign), '2025-11-15', 2431, 18, 46.75, 0, 327.90),
                    ((SELECT id FROM new_campaign), '2025-11-16', 2611, 63, 166.04, 1, 637.72),
                    ((SELECT id FROM new_campaign), '2025-11-17', 2102, 50, 123.98, 1, 406.54),
                    ((SELECT id FROM new_campaign), '2025-11-18', 743, 20, 49.47, 0, 152.15),
                    ((SELECT id FROM new_campaign), '2025-11-19', 1555, 13, 33.56, 0, 219.54),
                    ((SELECT id FROM new_campaign), '2025-11-20', 550, 4, 10.15, 0, 40.20),
                    ((SELECT id FROM new_campaign), '2025-11-21', 945, 12, 32.80, 0, 236.45),
                    ((SELECT id FROM new_campaign), '2025-11-22', 543, 9, 23.24, 0, 105.87),
                    ((SELECT id FROM new_campaign), '2025-11-23', 1674, 48, 112.49, 1, 404.79),
                    ((SELECT id FROM new_campaign), '2025-11-24', 3025, 20, 48.19, 0, 136.53),
                    ((SELECT id FROM new_campaign), '2025-11-25', 538, 11, 25.75, 0, 202.69),
                    ((SELECT id FROM new_campaign), '2025-11-26', 2420, 48, 123.17, 1, 833.39),
                    ((SELECT id FROM new_campaign), '2025-11-27', 943, 21, 50.95, 0, 380.99),
                    ((SELECT id FROM new_campaign), '2025-11-28', 613, 13, 33.47, 0, 243.14),
                    ((SELECT id FROM new_campaign), '2025-11-29', 894, 12, 27.54, 0, 202.61)
                )
                
            UPDATE campaigns 
            SET spent = 1988.33, conversions = 8, ctr = 1.75, roas = 5.16
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Feed - Awareness - 2025', 'meta', 'active', 2487, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 6204, 108, 82.28, 1, 189.23),
                    ((SELECT id FROM new_campaign), '2025-10-31', 8906, 195, 146.35, 4, 821.09),
                    ((SELECT id FROM new_campaign), '2025-11-01', 6420, 70, 55.43, 0, 153.22),
                    ((SELECT id FROM new_campaign), '2025-11-02', 3803, 98, 74.27, 2, 265.11),
                    ((SELECT id FROM new_campaign), '2025-11-03', 2670, 72, 57.85, 1, 279.39),
                    ((SELECT id FROM new_campaign), '2025-11-04', 4323, 60, 47.70, 1, 253.25),
                    ((SELECT id FROM new_campaign), '2025-11-05', 3742, 80, 62.55, 1, 213.73),
                    ((SELECT id FROM new_campaign), '2025-11-06', 4867, 108, 90.29, 1, 357.00),
                    ((SELECT id FROM new_campaign), '2025-11-07', 2184, 54, 39.01, 0, 128.39),
                    ((SELECT id FROM new_campaign), '2025-11-08', 6536, 76, 58.90, 1, 305.33),
                    ((SELECT id FROM new_campaign), '2025-11-09', 4867, 65, 49.54, 1, 211.66),
                    ((SELECT id FROM new_campaign), '2025-11-10', 7302, 193, 139.43, 3, 224.58),
                    ((SELECT id FROM new_campaign), '2025-11-11', 4785, 82, 60.23, 1, 252.23),
                    ((SELECT id FROM new_campaign), '2025-11-12', 11444, 70, 54.15, 0, 216.40),
                    ((SELECT id FROM new_campaign), '2025-11-13', 2140, 30, 24.47, 0, 114.52),
                    ((SELECT id FROM new_campaign), '2025-11-14', 1684, 13, 10.66, 0, 41.51),
                    ((SELECT id FROM new_campaign), '2025-11-15', 2880, 36, 26.38, 0, 110.77),
                    ((SELECT id FROM new_campaign), '2025-11-16', 7178, 177, 128.68, 2, 687.36),
                    ((SELECT id FROM new_campaign), '2025-11-17', 10582, 126, 104.34, 1, 520.90),
                    ((SELECT id FROM new_campaign), '2025-11-18', 5803, 171, 123.72, 3, 456.26),
                    ((SELECT id FROM new_campaign), '2025-11-19', 8876, 238, 199.51, 3, 634.74),
                    ((SELECT id FROM new_campaign), '2025-11-20', 4285, 77, 66.06, 1, 284.42),
                    ((SELECT id FROM new_campaign), '2025-11-21', 4292, 22, 17.54, 0, 48.57),
                    ((SELECT id FROM new_campaign), '2025-11-22', 5240, 128, 103.20, 1, 607.70),
                    ((SELECT id FROM new_campaign), '2025-11-23', 9146, 198, 157.15, 2, 765.47),
                    ((SELECT id FROM new_campaign), '2025-11-24', 3069, 37, 29.79, 0, 173.79),
                    ((SELECT id FROM new_campaign), '2025-11-25', 6633, 46, 37.98, 1, 143.33),
                    ((SELECT id FROM new_campaign), '2025-11-26', 5101, 77, 66.96, 1, 291.04),
                    ((SELECT id FROM new_campaign), '2025-11-27', 7550, 123, 98.29, 2, 314.02),
                    ((SELECT id FROM new_campaign), '2025-11-28', 6001, 78, 63.71, 1, 191.31),
                    ((SELECT id FROM new_campaign), '2025-11-29', 7582, 159, 122.64, 2, 665.48)
                )
                
            UPDATE campaigns 
            SET spent = 2399.03, conversions = 37, ctr = 1.74, roas = 4.14
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Stories - Conversão - 2025', 'meta', 'active', 3584, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 6246, 76, 56.32, 1, 212.77),
                    ((SELECT id FROM new_campaign), '2025-10-31', 7987, 164, 134.05, 2, 279.74),
                    ((SELECT id FROM new_campaign), '2025-11-01', 9286, 154, 127.22, 2, 555.26),
                    ((SELECT id FROM new_campaign), '2025-11-02', 5956, 41, 34.69, 0, 60.08),
                    ((SELECT id FROM new_campaign), '2025-11-03', 9170, 218, 187.80, 3, 359.61),
                    ((SELECT id FROM new_campaign), '2025-11-04', 6305, 63, 46.28, 1, 99.97),
                    ((SELECT id FROM new_campaign), '2025-11-05', 3835, 79, 64.94, 1, 244.05),
                    ((SELECT id FROM new_campaign), '2025-11-06', 6539, 132, 100.07, 1, 183.04),
                    ((SELECT id FROM new_campaign), '2025-11-07', 8611, 175, 144.29, 3, 804.61),
                    ((SELECT id FROM new_campaign), '2025-11-08', 7264, 114, 92.06, 2, 160.91),
                    ((SELECT id FROM new_campaign), '2025-11-09', 8772, 216, 162.31, 3, 531.17),
                    ((SELECT id FROM new_campaign), '2025-11-10', 3935, 104, 87.33, 2, 217.21),
                    ((SELECT id FROM new_campaign), '2025-11-11', 11983, 88, 73.12, 1, 318.71),
                    ((SELECT id FROM new_campaign), '2025-11-12', 7463, 127, 92.81, 2, 298.44),
                    ((SELECT id FROM new_campaign), '2025-11-13', 7450, 130, 104.94, 1, 495.29),
                    ((SELECT id FROM new_campaign), '2025-11-14', 10820, 284, 208.80, 3, 462.29),
                    ((SELECT id FROM new_campaign), '2025-11-15', 11517, 340, 254.85, 5, 1430.22),
                    ((SELECT id FROM new_campaign), '2025-11-16', 4637, 31, 25.24, 0, 45.12),
                    ((SELECT id FROM new_campaign), '2025-11-17', 3004, 31, 23.22, 0, 71.99),
                    ((SELECT id FROM new_campaign), '2025-11-18', 1553, 8, 6.46, 0, 19.74),
                    ((SELECT id FROM new_campaign), '2025-11-19', 2450, 30, 24.02, 0, 76.92),
                    ((SELECT id FROM new_campaign), '2025-11-20', 8000, 125, 98.42, 2, 450.85),
                    ((SELECT id FROM new_campaign), '2025-11-21', 10403, 222, 174.56, 3, 345.29),
                    ((SELECT id FROM new_campaign), '2025-11-22', 10371, 257, 188.92, 4, 516.22),
                    ((SELECT id FROM new_campaign), '2025-11-23', 3624, 39, 34.30, 0, 186.63),
                    ((SELECT id FROM new_campaign), '2025-11-24', 7484, 84, 64.78, 1, 126.66),
                    ((SELECT id FROM new_campaign), '2025-11-25', 2817, 44, 35.33, 0, 123.29),
                    ((SELECT id FROM new_campaign), '2025-11-26', 9720, 161, 129.03, 2, 422.23),
                    ((SELECT id FROM new_campaign), '2025-11-27', 4570, 98, 74.08, 1, 394.07),
                    ((SELECT id FROM new_campaign), '2025-11-28', 4579, 111, 87.52, 1, 270.57),
                    ((SELECT id FROM new_campaign), '2025-11-29', 2258, 57, 45.48, 0, 254.40)
                )
                
            UPDATE campaigns 
            SET spent = 2983.24, conversions = 47, ctr = 1.82, roas = 3.36
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'TrueView - Brand Lift - 2025', 'youtube', 'active', 3724, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 8026, 49, 7.76, 0, 28.92),
                    ((SELECT id FROM new_campaign), '2025-10-31', 14422, 227, 31.92, 1, 57.12),
                    ((SELECT id FROM new_campaign), '2025-11-01', 9237, 210, 31.89, 1, 47.13),
                    ((SELECT id FROM new_campaign), '2025-11-02', 6812, 96, 13.57, 0, 14.07),
                    ((SELECT id FROM new_campaign), '2025-11-03', 10704, 277, 44.84, 1, 147.08),
                    ((SELECT id FROM new_campaign), '2025-11-04', 3990, 39, 6.10, 0, 8.86),
                    ((SELECT id FROM new_campaign), '2025-11-05', 9308, 245, 35.57, 1, 53.28),
                    ((SELECT id FROM new_campaign), '2025-11-06', 21172, 261, 36.95, 1, 86.79),
                    ((SELECT id FROM new_campaign), '2025-11-07', 14700, 238, 33.95, 1, 57.96),
                    ((SELECT id FROM new_campaign), '2025-11-08', 20180, 353, 53.70, 1, 79.50),
                    ((SELECT id FROM new_campaign), '2025-11-09', 12017, 189, 27.43, 0, 39.10),
                    ((SELECT id FROM new_campaign), '2025-11-10', 9200, 100, 15.95, 0, 21.48),
                    ((SELECT id FROM new_campaign), '2025-11-11', 11237, 198, 29.98, 1, 90.48),
                    ((SELECT id FROM new_campaign), '2025-11-12', 14242, 152, 21.56, 1, 63.30),
                    ((SELECT id FROM new_campaign), '2025-11-13', 25512, 411, 60.66, 2, 235.68),
                    ((SELECT id FROM new_campaign), '2025-11-14', 9629, 162, 26.26, 0, 55.47),
                    ((SELECT id FROM new_campaign), '2025-11-15', 9774, 76, 12.21, 0, 18.98),
                    ((SELECT id FROM new_campaign), '2025-11-16', 13725, 392, 62.63, 2, 135.67),
                    ((SELECT id FROM new_campaign), '2025-11-17', 8401, 94, 14.93, 0, 29.23),
                    ((SELECT id FROM new_campaign), '2025-11-18', 25333, 460, 71.45, 3, 105.25),
                    ((SELECT id FROM new_campaign), '2025-11-19', 11678, 195, 31.46, 1, 82.28),
                    ((SELECT id FROM new_campaign), '2025-11-20', 15839, 218, 29.51, 1, 35.38),
                    ((SELECT id FROM new_campaign), '2025-11-21', 25273, 345, 50.00, 2, 81.88),
                    ((SELECT id FROM new_campaign), '2025-11-22', 7665, 185, 28.71, 1, 63.75),
                    ((SELECT id FROM new_campaign), '2025-11-23', 22975, 357, 56.01, 2, 77.45),
                    ((SELECT id FROM new_campaign), '2025-11-24', 17789, 328, 44.72, 2, 111.80),
                    ((SELECT id FROM new_campaign), '2025-11-25', 15930, 326, 44.05, 1, 64.20),
                    ((SELECT id FROM new_campaign), '2025-11-26', 9402, 270, 39.34, 1, 43.00),
                    ((SELECT id FROM new_campaign), '2025-11-27', 10776, 260, 38.30, 1, 139.07),
                    ((SELECT id FROM new_campaign), '2025-11-28', 15751, 346, 51.70, 1, 193.61),
                    ((SELECT id FROM new_campaign), '2025-11-29', 16568, 161, 25.48, 0, 89.62)
                )
                
            UPDATE campaigns 
            SET spent = 1078.55, conversions = 29, ctr = 1.69, roas = 2.19
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Bumper Ads - Reach - 2025', 'youtube', 'active', 1715, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 12669, 272, 39.40, 1, 41.21),
                    ((SELECT id FROM new_campaign), '2025-10-31', 15072, 386, 57.43, 1, 228.32),
                    ((SELECT id FROM new_campaign), '2025-11-01', 6541, 174, 28.08, 1, 109.36),
                    ((SELECT id FROM new_campaign), '2025-11-02', 25466, 625, 88.83, 3, 145.22),
                    ((SELECT id FROM new_campaign), '2025-11-03', 15431, 280, 38.84, 2, 101.68),
                    ((SELECT id FROM new_campaign), '2025-11-04', 12452, 271, 39.15, 1, 140.37),
                    ((SELECT id FROM new_campaign), '2025-11-05', 8041, 143, 20.06, 0, 79.89),
                    ((SELECT id FROM new_campaign), '2025-11-06', 6092, 47, 7.64, 0, 19.76),
                    ((SELECT id FROM new_campaign), '2025-11-07', 18648, 497, 75.10, 2, 125.55),
                    ((SELECT id FROM new_campaign), '2025-11-08', 13919, 273, 37.74, 1, 77.22),
                    ((SELECT id FROM new_campaign), '2025-11-09', 3511, 94, 13.52, 0, 50.75),
                    ((SELECT id FROM new_campaign), '2025-11-10', 8255, 197, 31.11, 1, 78.98),
                    ((SELECT id FROM new_campaign), '2025-11-11', 24018, 337, 46.16, 1, 92.33),
                    ((SELECT id FROM new_campaign), '2025-11-12', 19631, 556, 87.37, 3, 134.13),
                    ((SELECT id FROM new_campaign), '2025-11-13', 25425, 151, 20.72, 0, 66.18),
                    ((SELECT id FROM new_campaign), '2025-11-14', 15399, 378, 54.84, 1, 81.57),
                    ((SELECT id FROM new_campaign), '2025-11-15', 4605, 61, 9.56, 0, 29.77),
                    ((SELECT id FROM new_campaign), '2025-11-16', 8899, 132, 21.11, 0, 39.15),
                    ((SELECT id FROM new_campaign), '2025-11-17', 21372, 584, 81.86, 2, 269.97),
                    ((SELECT id FROM new_campaign), '2025-11-18', 9409, 93, 15.00, 0, 31.00),
                    ((SELECT id FROM new_campaign), '2025-11-19', 20095, 407, 65.90, 1, 147.70),
                    ((SELECT id FROM new_campaign), '2025-11-20', 18689, 396, 62.36, 1, 89.15),
                    ((SELECT id FROM new_campaign), '2025-11-21', 16609, 372, 60.16, 1, 133.47),
                    ((SELECT id FROM new_campaign), '2025-11-22', 11201, 147, 22.08, 0, 51.06),
                    ((SELECT id FROM new_campaign), '2025-11-23', 16304, 310, 42.07, 1, 129.14),
                    ((SELECT id FROM new_campaign), '2025-11-24', 7509, 201, 31.67, 1, 56.26),
                    ((SELECT id FROM new_campaign), '2025-11-25', 5471, 157, 23.40, 1, 40.60),
                    ((SELECT id FROM new_campaign), '2025-11-26', 6183, 139, 20.39, 0, 46.33),
                    ((SELECT id FROM new_campaign), '2025-11-27', 7413, 142, 22.69, 0, 48.43),
                    ((SELECT id FROM new_campaign), '2025-11-28', 19650, 365, 50.83, 2, 169.08),
                    ((SELECT id FROM new_campaign), '2025-11-29', 10216, 255, 38.11, 1, 151.34)
                )
                
            UPDATE campaigns 
            SET spent = 1253.17, conversions = 29, ctr = 2.04, roas = 2.40
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Sponsored Content - B2B - 2025', 'linkedin', 'active', 4543, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 523, 9, 139.49, 0, 463.72),
                    ((SELECT id FROM new_campaign), '2025-10-31', 725, 9, 133.37, 0, 377.90),
                    ((SELECT id FROM new_campaign), '2025-11-01', 855, 25, 337.97, 1, 940.07),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1137, 24, 389.79, 1, 1490.70),
                    ((SELECT id FROM new_campaign), '2025-11-03', 449, 13, 188.96, 0, 691.27),
                    ((SELECT id FROM new_campaign), '2025-11-04', 509, 9, 148.26, 0, 283.09),
                    ((SELECT id FROM new_campaign), '2025-11-05', 449, 4, 56.56, 0, 198.59),
                    ((SELECT id FROM new_campaign), '2025-11-06', 412, 6, 96.58, 0, 218.80),
                    ((SELECT id FROM new_campaign), '2025-11-07', 1003, 17, 234.54, 0, 1074.82),
                    ((SELECT id FROM new_campaign), '2025-11-08', 911, 9, 135.52, 0, 466.78),
                    ((SELECT id FROM new_campaign), '2025-11-09', 424, 10, 161.77, 0, 645.68),
                    ((SELECT id FROM new_campaign), '2025-11-10', 321, 1, 13.70, 0, 46.26),
                    ((SELECT id FROM new_campaign), '2025-11-11', 375, 4, 65.91, 0, 208.32),
                    ((SELECT id FROM new_campaign), '2025-11-12', 751, 18, 274.77, 1, 913.37),
                    ((SELECT id FROM new_campaign), '2025-11-13', 583, 6, 88.92, 0, 406.91),
                    ((SELECT id FROM new_campaign), '2025-11-14', 1007, 18, 285.29, 1, 1213.96),
                    ((SELECT id FROM new_campaign), '2025-11-15', 472, 2, 31.63, 0, 138.08),
                    ((SELECT id FROM new_campaign), '2025-11-16', 814, 12, 183.51, 0, 448.81),
                    ((SELECT id FROM new_campaign), '2025-11-17', 804, 22, 335.76, 1, 727.27),
                    ((SELECT id FROM new_campaign), '2025-11-18', 611, 13, 194.13, 0, 832.68),
                    ((SELECT id FROM new_campaign), '2025-11-19', 225, 4, 65.39, 0, 176.14),
                    ((SELECT id FROM new_campaign), '2025-11-20', 674, 16, 251.04, 0, 1159.44),
                    ((SELECT id FROM new_campaign), '2025-11-21', 1118, 10, 150.01, 0, 697.63),
                    ((SELECT id FROM new_campaign), '2025-11-22', 572, 10, 135.01, 0, 302.84),
                    ((SELECT id FROM new_campaign), '2025-11-23', 982, 25, 397.39, 1, 715.72),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1148, 30, 441.82, 2, 1224.30),
                    ((SELECT id FROM new_campaign), '2025-11-25', 686, 4, 63.07, 0, 140.02),
                    ((SELECT id FROM new_campaign), '2025-11-26', 656, 18, 284.55, 1, 857.42),
                    ((SELECT id FROM new_campaign), '2025-11-27', 736, 6, 84.52, 0, 377.04),
                    ((SELECT id FROM new_campaign), '2025-11-28', 236, 6, 81.55, 0, 397.31),
                    ((SELECT id FROM new_campaign), '2025-11-29', 1064, 25, 341.36, 1, 1031.00)
                )
                
            UPDATE campaigns 
            SET spent = 5792.14, conversions = 10, ctr = 1.81, roas = 3.26
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'InMail - Decision Makers - 2025', 'linkedin', 'active', 4432, 0, 0, 0, 0
                FROM clients WHERE name = 'Dr. Silva Odontologia'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 765, 14, 221.81, 0, 564.52),
                    ((SELECT id FROM new_campaign), '2025-10-31', 939, 8, 108.70, 0, 205.75),
                    ((SELECT id FROM new_campaign), '2025-11-01', 708, 5, 75.31, 0, 292.80),
                    ((SELECT id FROM new_campaign), '2025-11-02', 897, 22, 356.02, 1, 1432.11),
                    ((SELECT id FROM new_campaign), '2025-11-03', 657, 16, 261.69, 0, 397.00),
                    ((SELECT id FROM new_campaign), '2025-11-04', 399, 2, 30.18, 0, 148.73),
                    ((SELECT id FROM new_campaign), '2025-11-05', 551, 15, 215.17, 1, 498.11),
                    ((SELECT id FROM new_campaign), '2025-11-06', 1256, 28, 395.56, 1, 670.41),
                    ((SELECT id FROM new_campaign), '2025-11-07', 539, 4, 63.35, 0, 309.50),
                    ((SELECT id FROM new_campaign), '2025-11-08', 326, 6, 82.23, 0, 165.55),
                    ((SELECT id FROM new_campaign), '2025-11-09', 502, 11, 163.60, 0, 564.57),
                    ((SELECT id FROM new_campaign), '2025-11-10', 424, 10, 155.38, 0, 518.59),
                    ((SELECT id FROM new_campaign), '2025-11-11', 291, 6, 85.63, 0, 366.35),
                    ((SELECT id FROM new_campaign), '2025-11-12', 878, 17, 262.51, 0, 1148.91),
                    ((SELECT id FROM new_campaign), '2025-11-13', 786, 12, 183.99, 0, 331.82),
                    ((SELECT id FROM new_campaign), '2025-11-14', 491, 13, 197.13, 0, 256.43),
                    ((SELECT id FROM new_campaign), '2025-11-15', 1062, 24, 375.03, 1, 822.31),
                    ((SELECT id FROM new_campaign), '2025-11-16', 263, 6, 89.28, 0, 410.18),
                    ((SELECT id FROM new_campaign), '2025-11-17', 676, 5, 74.67, 0, 225.80),
                    ((SELECT id FROM new_campaign), '2025-11-18', 938, 23, 333.31, 1, 1650.97),
                    ((SELECT id FROM new_campaign), '2025-11-19', 562, 11, 158.33, 0, 437.84),
                    ((SELECT id FROM new_campaign), '2025-11-20', 601, 12, 196.83, 0, 762.20),
                    ((SELECT id FROM new_campaign), '2025-11-21', 350, 8, 128.17, 0, 286.98),
                    ((SELECT id FROM new_campaign), '2025-11-22', 1076, 23, 329.36, 1, 806.86),
                    ((SELECT id FROM new_campaign), '2025-11-23', 718, 4, 55.84, 0, 244.22),
                    ((SELECT id FROM new_campaign), '2025-11-24', 534, 13, 177.84, 0, 869.97),
                    ((SELECT id FROM new_campaign), '2025-11-25', 815, 14, 202.52, 0, 861.45),
                    ((SELECT id FROM new_campaign), '2025-11-26', 645, 11, 165.26, 0, 436.79),
                    ((SELECT id FROM new_campaign), '2025-11-27', 539, 5, 76.86, 0, 287.46),
                    ((SELECT id FROM new_campaign), '2025-11-28', 743, 19, 258.96, 1, 392.81),
                    ((SELECT id FROM new_campaign), '2025-11-29', 460, 9, 125.91, 0, 207.21)
                )
                
            UPDATE campaigns 
            SET spent = 5606.43, conversions = 7, ctr = 1.84, roas = 2.96
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Search - Institucional - 2025', 'google', 'active', 1543, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 710, 8, 18.88, 0, 75.55),
                    ((SELECT id FROM new_campaign), '2025-10-31', 1088, 8, 20.78, 0, 166.13),
                    ((SELECT id FROM new_campaign), '2025-11-01', 551, 12, 27.35, 0, 109.67),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1854, 51, 126.20, 2, 581.77),
                    ((SELECT id FROM new_campaign), '2025-11-03', 1677, 29, 70.46, 0, 403.87),
                    ((SELECT id FROM new_campaign), '2025-11-04', 859, 19, 48.36, 0, 291.24),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1628, 26, 66.42, 0, 170.69),
                    ((SELECT id FROM new_campaign), '2025-11-06', 2096, 56, 138.14, 2, 441.49),
                    ((SELECT id FROM new_campaign), '2025-11-07', 494, 11, 25.31, 0, 63.69),
                    ((SELECT id FROM new_campaign), '2025-11-08', 1143, 25, 59.42, 0, 124.52),
                    ((SELECT id FROM new_campaign), '2025-11-09', 941, 7, 16.10, 0, 86.55),
                    ((SELECT id FROM new_campaign), '2025-11-10', 2287, 17, 42.70, 0, 316.06),
                    ((SELECT id FROM new_campaign), '2025-11-11', 1529, 20, 53.73, 0, 346.91),
                    ((SELECT id FROM new_campaign), '2025-11-12', 823, 10, 25.28, 0, 119.17),
                    ((SELECT id FROM new_campaign), '2025-11-13', 1247, 37, 84.06, 1, 266.59),
                    ((SELECT id FROM new_campaign), '2025-11-14', 2359, 22, 53.36, 0, 366.80),
                    ((SELECT id FROM new_campaign), '2025-11-15', 1578, 15, 40.39, 0, 289.44),
                    ((SELECT id FROM new_campaign), '2025-11-16', 1178, 16, 39.18, 0, 234.33),
                    ((SELECT id FROM new_campaign), '2025-11-17', 3077, 49, 116.70, 1, 747.21),
                    ((SELECT id FROM new_campaign), '2025-11-18', 1323, 9, 23.02, 0, 142.81),
                    ((SELECT id FROM new_campaign), '2025-11-19', 1668, 15, 40.84, 0, 122.83),
                    ((SELECT id FROM new_campaign), '2025-11-20', 901, 18, 46.78, 0, 315.70),
                    ((SELECT id FROM new_campaign), '2025-11-21', 1884, 42, 110.11, 1, 665.43),
                    ((SELECT id FROM new_campaign), '2025-11-22', 1722, 43, 102.04, 1, 662.33),
                    ((SELECT id FROM new_campaign), '2025-11-23', 1667, 9, 20.69, 0, 108.19),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1734, 33, 76.17, 1, 552.57),
                    ((SELECT id FROM new_campaign), '2025-11-25', 1923, 30, 81.74, 1, 447.91),
                    ((SELECT id FROM new_campaign), '2025-11-26', 1911, 37, 87.38, 1, 234.69),
                    ((SELECT id FROM new_campaign), '2025-11-27', 965, 21, 57.16, 0, 293.50),
                    ((SELECT id FROM new_campaign), '2025-11-28', 434, 8, 18.79, 0, 66.35),
                    ((SELECT id FROM new_campaign), '2025-11-29', 1978, 49, 130.57, 1, 719.19)
                )
                
            UPDATE campaigns 
            SET spent = 1868.12, conversions = 12, ctr = 1.66, roas = 5.10
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Search - Competidores - 2025', 'google', 'active', 4161, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 2149, 57, 141.02, 2, 393.29),
                    ((SELECT id FROM new_campaign), '2025-10-31', 365, 8, 18.47, 0, 76.54),
                    ((SELECT id FROM new_campaign), '2025-11-01', 1081, 10, 26.90, 0, 67.65),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1284, 21, 55.65, 0, 407.71),
                    ((SELECT id FROM new_campaign), '2025-11-03', 1243, 10, 22.91, 0, 178.41),
                    ((SELECT id FROM new_campaign), '2025-11-04', 2369, 24, 54.82, 0, 260.65),
                    ((SELECT id FROM new_campaign), '2025-11-05', 1677, 11, 27.39, 0, 138.54),
                    ((SELECT id FROM new_campaign), '2025-11-06', 1248, 14, 34.38, 0, 223.65),
                    ((SELECT id FROM new_campaign), '2025-11-07', 2241, 16, 37.03, 0, 284.27),
                    ((SELECT id FROM new_campaign), '2025-11-08', 3095, 44, 103.15, 1, 797.55),
                    ((SELECT id FROM new_campaign), '2025-11-09', 1574, 31, 76.65, 1, 436.28),
                    ((SELECT id FROM new_campaign), '2025-11-10', 2843, 42, 104.54, 1, 539.66),
                    ((SELECT id FROM new_campaign), '2025-11-11', 3010, 18, 47.52, 0, 365.75),
                    ((SELECT id FROM new_campaign), '2025-11-12', 1515, 26, 68.01, 1, 353.49),
                    ((SELECT id FROM new_campaign), '2025-11-13', 1817, 34, 80.90, 1, 204.67),
                    ((SELECT id FROM new_campaign), '2025-11-14', 1117, 7, 19.07, 0, 136.51),
                    ((SELECT id FROM new_campaign), '2025-11-15', 714, 20, 49.39, 0, 138.46),
                    ((SELECT id FROM new_campaign), '2025-11-16', 2961, 34, 93.03, 1, 396.95),
                    ((SELECT id FROM new_campaign), '2025-11-17', 1628, 15, 34.04, 0, 268.03),
                    ((SELECT id FROM new_campaign), '2025-11-18', 699, 11, 27.35, 0, 213.40),
                    ((SELECT id FROM new_campaign), '2025-11-19', 2721, 80, 211.97, 2, 1667.77),
                    ((SELECT id FROM new_campaign), '2025-11-20', 2149, 64, 168.18, 1, 1007.34),
                    ((SELECT id FROM new_campaign), '2025-11-21', 899, 15, 41.16, 0, 140.54),
                    ((SELECT id FROM new_campaign), '2025-11-22', 1341, 9, 23.04, 0, 171.23),
                    ((SELECT id FROM new_campaign), '2025-11-23', 759, 9, 22.14, 0, 49.82),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1268, 30, 70.72, 1, 409.92),
                    ((SELECT id FROM new_campaign), '2025-11-25', 931, 8, 18.43, 0, 115.28),
                    ((SELECT id FROM new_campaign), '2025-11-26', 1820, 26, 70.77, 0, 415.05),
                    ((SELECT id FROM new_campaign), '2025-11-27', 802, 11, 25.79, 0, 154.28),
                    ((SELECT id FROM new_campaign), '2025-11-28', 341, 8, 20.01, 0, 66.23),
                    ((SELECT id FROM new_campaign), '2025-11-29', 1096, 10, 24.27, 0, 53.80)
                )
                
            UPDATE campaigns 
            SET spent = 1818.68, conversions = 12, ctr = 1.48, roas = 5.57
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Feed - Awareness - 2025', 'meta', 'active', 1145, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 8372, 153, 112.19, 3, 652.46),
                    ((SELECT id FROM new_campaign), '2025-10-31', 4884, 47, 38.13, 1, 186.74),
                    ((SELECT id FROM new_campaign), '2025-11-01', 7164, 132, 113.74, 2, 206.07),
                    ((SELECT id FROM new_campaign), '2025-11-02', 5927, 131, 111.55, 2, 380.99),
                    ((SELECT id FROM new_campaign), '2025-11-03', 7891, 128, 106.94, 1, 454.26),
                    ((SELECT id FROM new_campaign), '2025-11-04', 4588, 35, 27.75, 0, 109.08),
                    ((SELECT id FROM new_campaign), '2025-11-05', 4219, 33, 28.00, 0, 126.60),
                    ((SELECT id FROM new_campaign), '2025-11-06', 3990, 36, 30.59, 0, 143.36),
                    ((SELECT id FROM new_campaign), '2025-11-07', 7716, 130, 110.47, 2, 215.09),
                    ((SELECT id FROM new_campaign), '2025-11-08', 8509, 150, 114.03, 2, 244.10),
                    ((SELECT id FROM new_campaign), '2025-11-09', 6876, 57, 44.69, 0, 97.75),
                    ((SELECT id FROM new_campaign), '2025-11-10', 3956, 79, 69.25, 1, 141.07),
                    ((SELECT id FROM new_campaign), '2025-11-11', 4100, 62, 45.74, 0, 196.14),
                    ((SELECT id FROM new_campaign), '2025-11-12', 9854, 224, 161.51, 3, 617.97),
                    ((SELECT id FROM new_campaign), '2025-11-13', 4999, 111, 82.66, 2, 307.63),
                    ((SELECT id FROM new_campaign), '2025-11-14', 5429, 50, 38.63, 0, 61.07),
                    ((SELECT id FROM new_campaign), '2025-11-15', 3296, 43, 37.44, 0, 129.58),
                    ((SELECT id FROM new_campaign), '2025-11-16', 6458, 133, 112.90, 2, 392.11),
                    ((SELECT id FROM new_campaign), '2025-11-17', 2766, 60, 50.30, 1, 244.36),
                    ((SELECT id FROM new_campaign), '2025-11-18', 7386, 127, 94.17, 1, 438.93),
                    ((SELECT id FROM new_campaign), '2025-11-19', 7933, 174, 144.17, 2, 835.77),
                    ((SELECT id FROM new_campaign), '2025-11-20', 11060, 199, 170.03, 3, 418.80),
                    ((SELECT id FROM new_campaign), '2025-11-21', 5477, 71, 57.79, 1, 221.92),
                    ((SELECT id FROM new_campaign), '2025-11-22', 7068, 120, 88.65, 2, 311.15),
                    ((SELECT id FROM new_campaign), '2025-11-23', 3761, 24, 21.02, 0, 67.52),
                    ((SELECT id FROM new_campaign), '2025-11-24', 9031, 97, 82.83, 1, 482.34),
                    ((SELECT id FROM new_campaign), '2025-11-25', 9148, 150, 114.18, 2, 286.81),
                    ((SELECT id FROM new_campaign), '2025-11-26', 2977, 17, 14.27, 0, 33.41),
                    ((SELECT id FROM new_campaign), '2025-11-27', 8847, 66, 56.04, 1, 205.37),
                    ((SELECT id FROM new_campaign), '2025-11-28', 5199, 133, 108.22, 2, 234.87),
                    ((SELECT id FROM new_campaign), '2025-11-29', 4655, 70, 51.67, 1, 198.77)
                )
                
            UPDATE campaigns 
            SET spent = 2439.57, conversions = 38, ctr = 1.57, roas = 3.54
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Stories - Conversão - 2025', 'meta', 'active', 4364, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 6354, 133, 96.41, 1, 167.41),
                    ((SELECT id FROM new_campaign), '2025-10-31', 10672, 192, 157.49, 3, 734.71),
                    ((SELECT id FROM new_campaign), '2025-11-01', 12292, 300, 243.76, 5, 456.02),
                    ((SELECT id FROM new_campaign), '2025-11-02', 9126, 154, 123.17, 3, 271.84),
                    ((SELECT id FROM new_campaign), '2025-11-03', 5883, 52, 45.24, 0, 198.40),
                    ((SELECT id FROM new_campaign), '2025-11-04', 4341, 36, 30.75, 0, 140.21),
                    ((SELECT id FROM new_campaign), '2025-11-05', 8638, 117, 102.54, 1, 159.42),
                    ((SELECT id FROM new_campaign), '2025-11-06', 5667, 30, 21.86, 0, 101.52),
                    ((SELECT id FROM new_campaign), '2025-11-07', 8474, 196, 151.02, 4, 501.00),
                    ((SELECT id FROM new_campaign), '2025-11-08', 5587, 79, 67.74, 1, 359.30),
                    ((SELECT id FROM new_campaign), '2025-11-09', 6032, 54, 43.36, 1, 154.34),
                    ((SELECT id FROM new_campaign), '2025-11-10', 5198, 57, 48.49, 1, 154.32),
                    ((SELECT id FROM new_campaign), '2025-11-11', 7377, 200, 145.43, 2, 613.00),
                    ((SELECT id FROM new_campaign), '2025-11-12', 6644, 150, 109.73, 2, 278.69),
                    ((SELECT id FROM new_campaign), '2025-11-13', 6236, 120, 87.91, 2, 454.39),
                    ((SELECT id FROM new_campaign), '2025-11-14', 3167, 89, 75.97, 1, 189.20),
                    ((SELECT id FROM new_campaign), '2025-11-15', 7231, 68, 57.65, 1, 306.17),
                    ((SELECT id FROM new_campaign), '2025-11-16', 4079, 56, 45.74, 1, 79.00),
                    ((SELECT id FROM new_campaign), '2025-11-17', 2296, 28, 24.33, 0, 41.83),
                    ((SELECT id FROM new_campaign), '2025-11-18', 9400, 249, 201.06, 4, 357.08),
                    ((SELECT id FROM new_campaign), '2025-11-19', 3415, 84, 72.51, 1, 388.58),
                    ((SELECT id FROM new_campaign), '2025-11-20', 4718, 88, 65.59, 1, 259.69),
                    ((SELECT id FROM new_campaign), '2025-11-21', 3354, 68, 49.84, 0, 198.87),
                    ((SELECT id FROM new_campaign), '2025-11-22', 9191, 162, 120.80, 2, 629.02),
                    ((SELECT id FROM new_campaign), '2025-11-23', 9194, 95, 68.43, 2, 312.75),
                    ((SELECT id FROM new_campaign), '2025-11-24', 6727, 89, 65.63, 1, 390.00),
                    ((SELECT id FROM new_campaign), '2025-11-25', 4833, 77, 55.78, 1, 229.03),
                    ((SELECT id FROM new_campaign), '2025-11-26', 9156, 173, 144.66, 2, 310.89),
                    ((SELECT id FROM new_campaign), '2025-11-27', 10076, 66, 53.17, 0, 204.20),
                    ((SELECT id FROM new_campaign), '2025-11-28', 2666, 54, 42.64, 0, 64.42),
                    ((SELECT id FROM new_campaign), '2025-11-29', 10844, 172, 144.15, 2, 595.23)
                )
                
            UPDATE campaigns 
            SET spent = 2762.84, conversions = 45, ctr = 1.67, roas = 3.37
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'TrueView - Brand Lift - 2025', 'youtube', 'active', 1089, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 5139, 79, 11.35, 0, 29.92),
                    ((SELECT id FROM new_campaign), '2025-10-31', 3437, 42, 6.13, 0, 13.21),
                    ((SELECT id FROM new_campaign), '2025-11-01', 17580, 516, 78.90, 3, 242.53),
                    ((SELECT id FROM new_campaign), '2025-11-02', 23150, 407, 66.09, 2, 175.92),
                    ((SELECT id FROM new_campaign), '2025-11-03', 20225, 149, 24.07, 0, 33.13),
                    ((SELECT id FROM new_campaign), '2025-11-04', 9661, 231, 31.85, 1, 82.93),
                    ((SELECT id FROM new_campaign), '2025-11-05', 17195, 378, 51.73, 2, 54.50),
                    ((SELECT id FROM new_campaign), '2025-11-06', 15589, 243, 39.98, 1, 95.91),
                    ((SELECT id FROM new_campaign), '2025-11-07', 4412, 94, 13.14, 0, 33.43),
                    ((SELECT id FROM new_campaign), '2025-11-08', 22890, 647, 100.01, 4, 380.12),
                    ((SELECT id FROM new_campaign), '2025-11-09', 4803, 87, 11.81, 0, 46.37),
                    ((SELECT id FROM new_campaign), '2025-11-10', 16267, 463, 62.75, 3, 240.34),
                    ((SELECT id FROM new_campaign), '2025-11-11', 9106, 112, 17.49, 0, 37.68),
                    ((SELECT id FROM new_campaign), '2025-11-12', 24706, 321, 51.79, 1, 124.27),
                    ((SELECT id FROM new_campaign), '2025-11-13', 11405, 140, 22.43, 0, 83.70),
                    ((SELECT id FROM new_campaign), '2025-11-14', 4304, 121, 17.43, 0, 52.24),
                    ((SELECT id FROM new_campaign), '2025-11-15', 21152, 484, 78.40, 3, 254.44),
                    ((SELECT id FROM new_campaign), '2025-11-16', 22595, 165, 23.11, 0, 65.58),
                    ((SELECT id FROM new_campaign), '2025-11-17', 10656, 123, 19.19, 0, 53.99),
                    ((SELECT id FROM new_campaign), '2025-11-18', 11454, 294, 42.53, 1, 160.54),
                    ((SELECT id FROM new_campaign), '2025-11-19', 24192, 369, 54.08, 1, 128.92),
                    ((SELECT id FROM new_campaign), '2025-11-20', 14933, 176, 26.50, 1, 56.36),
                    ((SELECT id FROM new_campaign), '2025-11-21', 3446, 77, 10.96, 0, 19.93),
                    ((SELECT id FROM new_campaign), '2025-11-22', 13385, 92, 13.96, 0, 49.17),
                    ((SELECT id FROM new_campaign), '2025-11-23', 7734, 174, 23.67, 0, 91.25),
                    ((SELECT id FROM new_campaign), '2025-11-24', 7567, 178, 28.29, 0, 107.94),
                    ((SELECT id FROM new_campaign), '2025-11-25', 20276, 267, 42.09, 1, 133.74),
                    ((SELECT id FROM new_campaign), '2025-11-26', 16486, 173, 25.42, 1, 30.19),
                    ((SELECT id FROM new_campaign), '2025-11-27', 19348, 479, 73.55, 3, 226.58),
                    ((SELECT id FROM new_campaign), '2025-11-28', 11979, 120, 18.00, 0, 48.93),
                    ((SELECT id FROM new_campaign), '2025-11-29', 6915, 114, 15.72, 0, 47.94)
                )
                
            UPDATE campaigns 
            SET spent = 1102.41, conversions = 28, ctr = 1.73, roas = 2.90
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Bumper Ads - Reach - 2025', 'youtube', 'active', 2284, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 8555, 74, 11.08, 0, 24.20),
                    ((SELECT id FROM new_campaign), '2025-10-31', 4046, 71, 10.41, 0, 11.73),
                    ((SELECT id FROM new_campaign), '2025-11-01', 6436, 142, 21.55, 0, 35.41),
                    ((SELECT id FROM new_campaign), '2025-11-02', 14077, 172, 26.38, 0, 65.20),
                    ((SELECT id FROM new_campaign), '2025-11-03', 22684, 593, 96.95, 3, 347.24),
                    ((SELECT id FROM new_campaign), '2025-11-04', 8422, 86, 13.43, 0, 24.44),
                    ((SELECT id FROM new_campaign), '2025-11-05', 7526, 137, 19.86, 0, 76.37),
                    ((SELECT id FROM new_campaign), '2025-11-06', 7860, 88, 13.55, 0, 16.77),
                    ((SELECT id FROM new_campaign), '2025-11-07', 10960, 327, 49.68, 2, 168.66),
                    ((SELECT id FROM new_campaign), '2025-11-08', 13207, 378, 52.19, 2, 161.19),
                    ((SELECT id FROM new_campaign), '2025-11-09', 10757, 237, 33.49, 1, 126.57),
                    ((SELECT id FROM new_campaign), '2025-11-10', 5795, 162, 25.17, 0, 89.89),
                    ((SELECT id FROM new_campaign), '2025-11-11', 18546, 267, 41.84, 1, 111.77),
                    ((SELECT id FROM new_campaign), '2025-11-12', 6217, 184, 25.41, 1, 34.30),
                    ((SELECT id FROM new_campaign), '2025-11-13', 12851, 150, 24.63, 0, 78.35),
                    ((SELECT id FROM new_campaign), '2025-11-14', 11844, 341, 54.93, 1, 86.94),
                    ((SELECT id FROM new_campaign), '2025-11-15', 5978, 42, 6.53, 0, 15.16),
                    ((SELECT id FROM new_campaign), '2025-11-16', 8241, 52, 7.75, 0, 8.55),
                    ((SELECT id FROM new_campaign), '2025-11-17', 18807, 323, 47.41, 1, 94.96),
                    ((SELECT id FROM new_campaign), '2025-11-18', 16116, 244, 33.82, 1, 68.86),
                    ((SELECT id FROM new_campaign), '2025-11-19', 13656, 401, 64.51, 2, 166.72),
                    ((SELECT id FROM new_campaign), '2025-11-20', 18534, 518, 73.54, 3, 97.00),
                    ((SELECT id FROM new_campaign), '2025-11-21', 16802, 109, 17.97, 0, 43.77),
                    ((SELECT id FROM new_campaign), '2025-11-22', 10485, 257, 36.85, 1, 139.55),
                    ((SELECT id FROM new_campaign), '2025-11-23', 6476, 81, 12.37, 0, 45.47),
                    ((SELECT id FROM new_campaign), '2025-11-24', 10281, 248, 36.31, 1, 105.04),
                    ((SELECT id FROM new_campaign), '2025-11-25', 21730, 243, 33.93, 1, 120.13),
                    ((SELECT id FROM new_campaign), '2025-11-26', 13382, 204, 29.58, 1, 111.89),
                    ((SELECT id FROM new_campaign), '2025-11-27', 7032, 157, 21.99, 1, 66.45),
                    ((SELECT id FROM new_campaign), '2025-11-28', 30569, 334, 47.30, 2, 109.36),
                    ((SELECT id FROM new_campaign), '2025-11-29', 13057, 202, 29.23, 0, 32.42)
                )
                
            UPDATE campaigns 
            SET spent = 1019.64, conversions = 25, ctr = 1.79, roas = 2.63
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'Sponsored Content - B2B - 2025', 'linkedin', 'active', 1988, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 341, 7, 99.96, 0, 250.77),
                    ((SELECT id FROM new_campaign), '2025-10-31', 368, 8, 111.65, 0, 265.51),
                    ((SELECT id FROM new_campaign), '2025-11-01', 363, 7, 100.65, 0, 302.50),
                    ((SELECT id FROM new_campaign), '2025-11-02', 1002, 7, 106.98, 0, 266.38),
                    ((SELECT id FROM new_campaign), '2025-11-03', 654, 14, 214.71, 0, 695.15),
                    ((SELECT id FROM new_campaign), '2025-11-04', 331, 5, 78.27, 0, 207.59),
                    ((SELECT id FROM new_campaign), '2025-11-05', 200, 4, 59.68, 0, 219.17),
                    ((SELECT id FROM new_campaign), '2025-11-06', 789, 5, 74.80, 0, 312.91),
                    ((SELECT id FROM new_campaign), '2025-11-07', 473, 10, 152.86, 0, 677.07),
                    ((SELECT id FROM new_campaign), '2025-11-08', 737, 12, 166.28, 0, 660.61),
                    ((SELECT id FROM new_campaign), '2025-11-09', 871, 9, 140.17, 0, 658.35),
                    ((SELECT id FROM new_campaign), '2025-11-10', 706, 11, 167.80, 0, 556.24),
                    ((SELECT id FROM new_campaign), '2025-11-11', 674, 6, 87.30, 0, 221.76),
                    ((SELECT id FROM new_campaign), '2025-11-12', 729, 15, 203.77, 1, 861.57),
                    ((SELECT id FROM new_campaign), '2025-11-13', 515, 11, 169.86, 0, 499.58),
                    ((SELECT id FROM new_campaign), '2025-11-14', 371, 8, 112.81, 0, 219.25),
                    ((SELECT id FROM new_campaign), '2025-11-15', 383, 6, 97.90, 0, 473.34),
                    ((SELECT id FROM new_campaign), '2025-11-16', 494, 10, 149.80, 0, 596.11),
                    ((SELECT id FROM new_campaign), '2025-11-17', 140, 1, 15.84, 0, 25.51),
                    ((SELECT id FROM new_campaign), '2025-11-18', 496, 8, 122.87, 0, 273.70),
                    ((SELECT id FROM new_campaign), '2025-11-19', 515, 14, 211.95, 1, 782.24),
                    ((SELECT id FROM new_campaign), '2025-11-20', 242, 3, 47.18, 0, 157.87),
                    ((SELECT id FROM new_campaign), '2025-11-21', 235, 1, 13.63, 0, 26.05),
                    ((SELECT id FROM new_campaign), '2025-11-22', 725, 4, 61.96, 0, 197.22),
                    ((SELECT id FROM new_campaign), '2025-11-23', 336, 7, 115.06, 0, 371.40),
                    ((SELECT id FROM new_campaign), '2025-11-24', 712, 14, 221.27, 1, 428.23),
                    ((SELECT id FROM new_campaign), '2025-11-25', 262, 7, 96.67, 0, 274.95),
                    ((SELECT id FROM new_campaign), '2025-11-26', 400, 10, 155.37, 0, 239.69),
                    ((SELECT id FROM new_campaign), '2025-11-27', 729, 5, 73.70, 0, 142.25),
                    ((SELECT id FROM new_campaign), '2025-11-28', 838, 16, 231.17, 0, 479.82),
                    ((SELECT id FROM new_campaign), '2025-11-29', 599, 17, 249.28, 0, 1124.17)
                )
                
            UPDATE campaigns 
            SET spent = 3911.19, conversions = 3, ctr = 1.61, roas = 3.19
            WHERE id = (SELECT id FROM new_campaign);
            

            WITH new_campaign AS (
                INSERT INTO campaigns (client_id, name, platform, status, budget, spent, ctr, roas, conversions)
                SELECT id, 'InMail - Decision Makers - 2025', 'linkedin', 'active', 1100, 0, 0, 0, 0
                FROM clients WHERE name = 'Moda & Estilo'
                RETURNING id
            )
            
                , inserted_metrics AS (
                    INSERT INTO campaign_daily_metrics (campaign_id, date, impressions, clicks, spend, conversions, revenue)
                    VALUES 
                    ((SELECT id FROM new_campaign), '2025-10-30', 619, 17, 247.42, 0, 980.40),
                    ((SELECT id FROM new_campaign), '2025-10-31', 589, 16, 232.72, 0, 944.84),
                    ((SELECT id FROM new_campaign), '2025-11-01', 1013, 12, 183.58, 0, 463.86),
                    ((SELECT id FROM new_campaign), '2025-11-02', 606, 17, 264.81, 1, 820.71),
                    ((SELECT id FROM new_campaign), '2025-11-03', 383, 10, 150.59, 0, 647.55),
                    ((SELECT id FROM new_campaign), '2025-11-04', 305, 1, 14.67, 0, 35.22),
                    ((SELECT id FROM new_campaign), '2025-11-05', 683, 7, 102.13, 0, 311.26),
                    ((SELECT id FROM new_campaign), '2025-11-06', 364, 5, 82.33, 0, 361.31),
                    ((SELECT id FROM new_campaign), '2025-11-07', 294, 6, 97.77, 0, 168.88),
                    ((SELECT id FROM new_campaign), '2025-11-08', 713, 19, 298.75, 1, 826.17),
                    ((SELECT id FROM new_campaign), '2025-11-09', 200, 3, 41.73, 0, 119.41),
                    ((SELECT id FROM new_campaign), '2025-11-10', 248, 3, 42.49, 0, 175.73),
                    ((SELECT id FROM new_campaign), '2025-11-11', 702, 20, 319.31, 0, 1521.32),
                    ((SELECT id FROM new_campaign), '2025-11-12', 216, 5, 81.70, 0, 397.99),
                    ((SELECT id FROM new_campaign), '2025-11-13', 434, 4, 59.05, 0, 108.52),
                    ((SELECT id FROM new_campaign), '2025-11-14', 788, 19, 294.87, 0, 1065.54),
                    ((SELECT id FROM new_campaign), '2025-11-15', 437, 11, 174.64, 0, 859.33),
                    ((SELECT id FROM new_campaign), '2025-11-16', 534, 10, 163.76, 0, 553.25),
                    ((SELECT id FROM new_campaign), '2025-11-17', 727, 8, 121.65, 0, 308.01),
                    ((SELECT id FROM new_campaign), '2025-11-18', 195, 3, 48.76, 0, 167.40),
                    ((SELECT id FROM new_campaign), '2025-11-19', 570, 10, 138.13, 0, 216.86),
                    ((SELECT id FROM new_campaign), '2025-11-20', 556, 13, 190.13, 0, 787.43),
                    ((SELECT id FROM new_campaign), '2025-11-21', 726, 15, 244.11, 0, 419.06),
                    ((SELECT id FROM new_campaign), '2025-11-22', 1009, 19, 312.76, 0, 867.22),
                    ((SELECT id FROM new_campaign), '2025-11-23', 990, 26, 411.39, 1, 578.50),
                    ((SELECT id FROM new_campaign), '2025-11-24', 1089, 22, 358.79, 1, 986.92),
                    ((SELECT id FROM new_campaign), '2025-11-25', 196, 3, 46.76, 0, 126.03),
                    ((SELECT id FROM new_campaign), '2025-11-26', 269, 3, 48.32, 0, 148.28),
                    ((SELECT id FROM new_campaign), '2025-11-27', 585, 4, 65.83, 0, 140.11),
                    ((SELECT id FROM new_campaign), '2025-11-28', 198, 4, 58.93, 0, 262.69),
                    ((SELECT id FROM new_campaign), '2025-11-29', 531, 13, 192.02, 0, 492.26)
                )
                
            UPDATE campaigns 
            SET spent = 5089.91, conversions = 4, ctr = 1.96, roas = 3.12
            WHERE id = (SELECT id FROM new_campaign);
            
COMMIT;
