
UPDATE public.products SET images = ARRAY['/images/jersey-1.jpg','/images/jersey-2.jpg'] WHERE code IN ('CAM-001','CAM-004');
UPDATE public.products SET images = ARRAY['/images/jersey-2.jpg','/images/jersey-1.jpg'] WHERE code IN ('CAM-002','CAM-005','CAM-006');
UPDATE public.products SET images = ARRAY['/images/jersey-3.jpg','/images/jersey-1.jpg'] WHERE code = 'CAM-003';
