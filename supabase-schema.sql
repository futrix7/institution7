-- ============================================
-- TNGC (The New Generation Computers)
-- Supabase Database Schema
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE course_type AS ENUM ('long-term', 'short-term');
CREATE TYPE course_status AS ENUM ('active', 'upcoming', 'full');
CREATE TYPE student_status AS ENUM ('Active', 'Inactive', 'Pending');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE teacher_status AS ENUM ('Active', 'On Leave');
CREATE TYPE payment_status AS ENUM ('Paid', 'Pending', 'Partial', 'Overdue');
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Leave');
CREATE TYPE certificate_status AS ENUM ('Issued', 'Pending', 'Rejected', 'Processing', 'Requested');
CREATE TYPE certificate_type AS ENUM ('Completion', 'Proficiency', 'Module');
CREATE TYPE video_status AS ENUM ('Published', 'Draft', 'Processing');
CREATE TYPE announcement_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE qualification_type AS ENUM ('B.Tech', 'M.Tech', 'MCA', 'M.Sc', 'PhD', 'Others');
CREATE TYPE specialization_type AS ENUM ('Java', 'Python', 'Web Development', 'Database', 'Networking', 'MS-Office');
CREATE TYPE experience_range AS ENUM ('0-1', '1-3', '3-5', '5-10', '10+');
CREATE TYPE eligibility_type AS ENUM ('10th', '12th', 'graduate', 'any');

-- ============================================
-- TABLES
-- ============================================

-- BRANCHES
CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  note TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSES
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  duration TEXT NOT NULL,
  type course_type NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  fees TEXT NOT NULL,
  fee_numeric INTEGER NOT NULL DEFAULT 0,
  eligibility TEXT NOT NULL,
  certification TEXT NOT NULL,
  certification_body TEXT NOT NULL,
  popular BOOLEAN DEFAULT FALSE,
  highlights TEXT[] DEFAULT '{}',
  career_opportunities TEXT[] DEFAULT '{}',
  tools TEXT[] DEFAULT '{}',
  schedule TEXT NOT NULL,
  batch_size TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  completion_rate INTEGER DEFAULT 0,
  next_batch TEXT,
  status course_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender gender_type,
  address TEXT,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  course_slug TEXT REFERENCES courses(slug) ON DELETE SET NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  batch_time TEXT,
  status student_status DEFAULT 'Active',
  father_name TEXT,
  father_phone TEXT,
  mother_name TEXT,
  alternate_phone TEXT,
  profile_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHERS / FACULTY
CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  subjects TEXT[] DEFAULT '{}',
  experience INTEGER DEFAULT 0,
  qualification qualification_type,
  specialization specialization_type,
  salary NUMERIC(10,2),
  status teacher_status DEFAULT 'Active',
  profile_photo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADMINS
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'Administrator',
  bio TEXT,
  profile_photo TEXT,
  admin_code TEXT,
  status TEXT DEFAULT 'Active',
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  notify_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEE STRUCTURE (per student)
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  course_slug TEXT REFERENCES courses(slug) ON DELETE SET NULL,
  total_fee NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  pending_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEE INSTALLMENTS
CREATE TABLE fee_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEE EXTRA CHARGES
CREATE TABLE fee_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Paid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_slug TEXT REFERENCES courses(slug) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  method TEXT NOT NULL,
  status payment_status DEFAULT 'Paid',
  receipt_no TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTENDANCE
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  hours DECIMAL(3,1) DEFAULT 0,
  status attendance_status NOT NULL,
  course_slug TEXT REFERENCES courses(slug) ON DELETE SET NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- CERTIFICATES
CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_slug TEXT REFERENCES courses(slug) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type certificate_type NOT NULL,
  issued_date DATE,
  credential_id TEXT,
  issued_by TEXT,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  status certificate_status DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIDEOS
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT,
  course_slug TEXT REFERENCES courses(slug) ON DELETE SET NULL,
  duration TEXT,
  views INTEGER DEFAULT 0,
  uploaded_by TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  upload_date DATE DEFAULT CURRENT_DATE,
  status video_status DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority announcement_priority DEFAULT 'medium',
  target TEXT DEFAULT 'All Students',
  author_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  author_name TEXT,
  published_date DATE DEFAULT CURRENT_DATE,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS (Finance)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type transaction_type NOT NULL,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PENDING TASKS
CREATE TABLE pending_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACULTY (Landing page)
CREATE TABLE faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  branch TEXT,
  qualifications TEXT[] DEFAULT '{}',
  description TEXT,
  is_founder BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_students_branch ON students(branch_id);
CREATE INDEX idx_students_course ON students(course_slug);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_teachers_branch ON teachers(branch_id);
CREATE INDEX idx_fees_student ON fees(student_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_videos_course ON videos(course_slug);
CREATE INDEX idx_announcements_pinned ON announcements(pinned);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins full access" ON branches FOR ALL USING (true);
CREATE POLICY "Admins full access" ON courses FOR ALL USING (true);
CREATE POLICY "Admins full access" ON students FOR ALL USING (true);
CREATE POLICY "Admins full access" ON teachers FOR ALL USING (true);
CREATE POLICY "Admins full access" ON admins FOR ALL USING (true);
CREATE POLICY "Admins full access" ON fees FOR ALL USING (true);
CREATE POLICY "Admins full access" ON fee_installments FOR ALL USING (true);
CREATE POLICY "Admins full access" ON fee_extras FOR ALL USING (true);
CREATE POLICY "Admins full access" ON payments FOR ALL USING (true);
CREATE POLICY "Admins full access" ON attendance FOR ALL USING (true);
CREATE POLICY "Admins full access" ON certificates FOR ALL USING (true);
CREATE POLICY "Admins full access" ON transactions FOR ALL USING (true);
CREATE POLICY "Admins full access" ON activity_log FOR ALL USING (true);
CREATE POLICY "Admins full access" ON events FOR ALL USING (true);
CREATE POLICY "Admins full access" ON pending_tasks FOR ALL USING (true);
CREATE POLICY "Admins full access" ON videos FOR ALL USING (true);
CREATE POLICY "Admins full access" ON announcements FOR ALL USING (true);
CREATE POLICY "Admins full access" ON faculty FOR ALL USING (true);

-- Students: read access
CREATE POLICY "Students read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Students read branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Students read announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Students read videos" ON videos FOR SELECT USING (status = 'Published');
CREATE POLICY "Students read faculty" ON faculty FOR SELECT USING (true);
CREATE POLICY "Students manage own" ON students FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Students own fees" ON fees FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Students own installments" ON fee_installments FOR SELECT USING (
  fee_id IN (
    SELECT f.id FROM fees f
    JOIN students s ON f.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);
CREATE POLICY "Students own extras" ON fee_extras FOR SELECT USING (
  fee_id IN (
    SELECT f.id FROM fees f
    JOIN students s ON f.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);
CREATE POLICY "Students own payments" ON payments FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Students own attendance" ON attendance FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Students own certificates" ON certificates FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- ============================================
-- SEED DATA: Branches
-- ============================================

INSERT INTO branches (id, name, tag, address, city, is_primary) VALUES
  ('ramanthapur', 'Ramanthapur', 'Main Branch', 'Near Ramanthapur Bus Stand', 'Hyderabad, Telangana - 500013', true),
  ('amberpet', 'Amberpet', NULL, 'Amberpet Main Road', 'Hyderabad, Telangana - 500013', false),
  ('kodad', 'Kodad', NULL, 'Kodad Town Center', 'Kodad, Telangana - 508201', false);

-- ============================================
-- SEED DATA: Courses (Long-Term)
-- ============================================

INSERT INTO courses (slug, name, short_name, duration, type, description, full_description, topics, fees, fee_numeric, eligibility, certification, certification_body, popular, highlights, career_opportunities, tools, schedule, batch_size, status) VALUES
('dca', 'DCA', 'DCA', '40 Days', 'long-term', 'Diploma in Computer Applications', 'The Diploma in Computer Applications (DCA) is a foundational programme designed for students and professionals who want to build strong computer skills.', ARRAY['Basics','Typing Tutor','Windows','MS-Word','MS-Excel','MS-PowerPoint','Internet Level-I'], '₹3,000', 3000, '10th Pass or equivalent', 'Government Recognised Certificate', 'TNGC Institute', false, ARRAY['Hands-on practical training','Small batch sizes','Job-ready skills in 40 days','Free study material'], ARRAY['Data Entry Operator','Office Assistant','Computer Operator','BPO / KPO Executive'], ARRAY['MS-Word','MS-Excel','MS-PowerPoint','Internet Explorer'], 'Weekdays: 9 AM - 11 AM', '15-20 students', 'active'),
('adca', 'ADCA', 'ADCA', '2 Months', 'long-term', 'Advanced Diploma in Computer Applications', 'The Advanced Diploma in Computer Applications (ADCA) builds upon the DCA curriculum with deeper coverage of MS-Office tools, internet applications, accounting fundamentals, and Tally Prime.', ARRAY['Basics','Typing Tutor','Windows','MS-Office Suite','Internet','Accounting Intro','Tally Prime'], '₹5,000', 5000, '10th Pass or equivalent', 'Government Recognised Certificate', 'TNGC Institute', false, ARRAY['Tally Prime with GST','Advanced Excel & pivot tables','Practical accounting concepts','Placement assistance'], ARRAY['Accounts Assistant','Office Executive','Tally Operator','Inventory Manager'], ARRAY['MS-Office','Tally Prime','Internet','Email'], 'Weekdays: 9 AM - 11 AM', '15-20 students', 'active'),
('pgdca', 'PGDCA', 'PGDCA', '2 Months', 'long-term', 'Post Graduate Diploma in Computer Applications', 'The Post Graduate Diploma in Computer Applications (PGDCA) is designed for graduates who want to gain advanced computer knowledge.', ARRAY['Basics','Typing Tutor','MS-Office Suite','Internet Concept','C Language'], '₹6,000', 6000, 'Graduate or equivalent', 'Government Recognised Certificate', 'TNGC Institute', false, ARRAY['C Language programming','Advanced MS-Office skills','Internet & web concepts','Industry-relevant curriculum'], ARRAY['Software Trainee','IT Support Executive','Office Automation Specialist','Web Assistant'], ARRAY['MS-Office','C Language Compiler','Internet'], 'Weekdays: 9 AM - 11 AM', '15-20 students', 'active'),
('pgjpl', 'PGJPL', 'Java Programming', '4 Months', 'long-term', 'Java Programming Language', 'The PGJPL programme is a comprehensive Java development course covering everything from C Language fundamentals to Core Java, Java 8 features, Advanced Java, and database connectivity with JDBC.', ARRAY['C Language','Core Java','Java 8','Advanced Java','DBMS-JDBC'], '₹12,000', 12000, 'Graduate or equivalent', 'Government Recognised Certificate', 'TNGC Institute', false, ARRAY['Java 8+ features (Streams, Lambdas)','Spring basics introduction','Database connectivity with JDBC','Real-world project work'], ARRAY['Java Developer Trainee','Software Developer','Backend Developer','Full Stack Developer (Java)'], ARRAY['VS Code','IntelliJ IDEA','MySQL','Git'], 'Weekdays: 9 AM - 11 AM', '15-20 students', 'active'),
('pgppl', 'PGPPL', 'Python Programming', '4 Months', 'long-term', 'Python Programming Language', 'The PGPPL programme provides in-depth knowledge of Python programming from fundamentals to advanced concepts.', ARRAY['C Language','Core Python','Advanced Python','Tkinter','DBMS-JDBC'], '₹12,000', 12000, 'Graduate or equivalent', 'Government Recognised Certificate', 'TNGC Institute', false, ARRAY['Core & Advanced Python','GUI development with Tkinter','Database integration','Project-based learning'], ARRAY['Python Developer Trainee','Automation Tester','Data Analyst (Entry Level)','Software Developer'], ARRAY['VS Code','PyCharm','MySQL','Git'], 'Weekdays: 9 AM - 11 AM', '15-20 students', 'active'),
('python-full-stack', 'Python Full Stack', 'Python Full Stack', '6 Months', 'long-term', 'Complete Python Developer Programme', 'The Python Full Stack Developer Programme is our flagship course covering Core Python, Object-Oriented Programming, Django web framework, HTML/CSS, JavaScript, and a comprehensive live project.', ARRAY['Core Python','OOPS','Django','HTML/CSS','JavaScript','Live Project'], '₹25,000', 25000, '12th Pass or equivalent', 'Government Recognised Certificate + Course Completion', 'TNGC Institute', true, ARRAY['Django REST framework','HTML5, CSS3, JavaScript ES6+','Git & GitHub workflow','2-month live industry project','100% placement assistance'], ARRAY['Python Full Stack Developer','Django Developer','Web Developer','Software Engineer','Freelance Developer'], ARRAY['VS Code','PyCharm','Django','PostgreSQL','Git','HTML/CSS/JS'], 'Weekdays: 9 AM - 12 PM', '15-20 students', 'active'),
('java-full-stack', 'Java Full Stack', 'Java Full Stack', '6 Months', 'long-term', 'Complete Java Developer Programme', 'The Java Full Stack Developer Programme covers Core Java, Java 8, Spring Boot, HTML/CSS, JavaScript, and a live project.', ARRAY['Core Java','Java 8','Spring Boot','HTML/CSS','JavaScript','Live Project'], '₹25,000', 25000, '12th Pass or equivalent', 'Government Recognised Certificate + Course Completion', 'TNGC Institute', true, ARRAY['Spring Boot & Microservices basics','Java 8+ features','RESTful API development','2-month live industry project','100% placement assistance'], ARRAY['Java Full Stack Developer','Spring Boot Developer','Software Engineer','Backend Developer','Enterprise Application Developer'], ARRAY['IntelliJ IDEA','VS Code','Spring Boot','MySQL','Git','HTML/CSS/JS'], 'Weekdays: 9 AM - 12 PM', '15-20 students', 'active'),
('adwd', 'A.D.W.D', 'Web Design', '3 Months', 'long-term', 'Advanced Web Designing', 'The Advanced Web Designing programme teaches modern front-end web development including HTML5, CSS3, JavaScript, and Bootstrap.', ARRAY['HTML','CSS','JavaScript','Bootstrap'], '₹8,000', 8000, '10th Pass or equivalent', 'Government Recognised Certificate', 'TNGC Institute', false, ARRAY['Responsive web design','Bootstrap 5 framework','JavaScript DOM manipulation','Portfolio project'], ARRAY['Front-End Developer','Web Designer','UI Developer','Freelance Web Designer'], ARRAY['VS Code','HTML5','CSS3','JavaScript','Bootstrap 5'], 'Weekdays: 9 AM - 11 AM', '15-20 students', 'active');

-- ============================================
-- SEED DATA: Courses (Short-Term)
-- ============================================

INSERT INTO courses (slug, name, short_name, duration, type, description, full_description, topics, fees, fee_numeric, eligibility, certification, certification_body, popular, highlights, career_opportunities, tools, schedule, batch_size, status) VALUES
('basic-computer', 'Basic', 'Basic', '10 Days', 'short-term', 'Fundamental computer operations and usage', 'A quick introductory course covering the fundamentals of computer operations.', ARRAY['Computer Basics','Mouse & Keyboard','File Management','Windows'], '₹1,000', 1000, 'No prior experience needed', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Hands-on practice','Small batch sizes','Beginner friendly'], ARRAY['Foundation for further courses'], ARRAY['Windows OS','Mouse','Keyboard'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('internet-concept', 'Internet Concept', 'Internet', '10 Days', 'short-term', 'Internet browsing, email, and online safety', 'Learn how to navigate the internet effectively, use email services, and practice online safety.', ARRAY['Web Browsing','Email','Online Safety','Search Techniques'], '₹1,000', 1000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Practical internet skills','Email management','Cyber safety awareness'], ARRAY['Foundation for further courses'], ARRAY['Chrome Browser','Gmail','Google Search'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('ms-office', 'MS-Office', 'MS-Office', '20 Days', 'short-term', 'Complete Microsoft Office suite training', 'Master the Microsoft Office suite including Word, Excel, PowerPoint, and Outlook.', ARRAY['MS-Word','MS-Excel','MS-PowerPoint','MS-Outlook'], '₹2,500', 2500, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['All MS-Office applications','Practical exercises','Certificate included'], ARRAY['Office Executive','Data Entry Operator','Admin Assistant'], ARRAY['MS-Word','MS-Excel','MS-PowerPoint','MS-Outlook'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('tally-prime', 'Tally PRIME', 'Tally', '2 Months', 'short-term', 'Complete Tally Prime with GST', 'Learn Tally Prime from basics to advanced including GST, payroll, and inventory management.', ARRAY['Tally Basics','GST','Payroll','Inventory','Reports'], '₹5,000', 5000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['GST compliance','Real-world accounting','Inventory management','Professional certification prep'], ARRAY['Tally Operator','Accounts Executive','Inventory Manager'], ARRAY['Tally Prime','MS-Excel'], 'Weekdays: 9 AM - 11 AM', '10-15 students', 'active'),
('c-language', 'C Language', 'C', '2 Months', 'short-term', 'C programming language fundamentals', 'Learn C programming from basics to advanced concepts including pointers, structures, and file handling.', ARRAY['C Basics','Control Structures','Functions','Pointers','File Handling'], '₹4,000', 4000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Strong programming foundation','Hands-on coding practice','Interview preparation'], ARRAY['Software Trainee','Programming Tutor','Embedded Systems Junior'], ARRAY['VS Code','Turbo C','GCC Compiler'], 'Weekdays: 9 AM - 11 AM', '10-15 students', 'active'),
('oracle', 'Oracle', 'Oracle', '2 Months', 'short-term', 'Oracle SQL and PL/SQL database programming', 'Master Oracle database programming including SQL queries, PL/SQL, and database management.', ARRAY['SQL Basics','Advanced SQL','PL/SQL','Database Management'], '₹6,000', 6000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Industry-standard database skills','PL/SQL programming','Real-world projects'], ARRAY['Database Administrator','SQL Developer','Data Analyst'], ARRAY['Oracle Database','SQL Developer','VS Code'], 'Weekdays: 9 AM - 11 AM', '10-15 students', 'active'),
('advanced-excel', 'Advanced Excel', 'Excel', '15 Days', 'short-term', 'Advanced Microsoft Excel features', 'Master advanced Excel features including pivot tables, VLOOKUP, macros, and data visualization.', ARRAY['Advanced Formulas','Pivot Tables','Macros','Data Visualization','Dashboard Creation'], '₹2,000', 2000, 'Basic MS-Office knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Pivot table mastery','Macro automation','Dashboard creation'], ARRAY['Data Analyst','Reporting Executive','Business Analyst'], ARRAY['MS-Excel','VBA Editor'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('core-java', 'Core Java', 'Java', '2 Months', 'short-term', 'Core Java programming fundamentals', 'Learn Java programming from basics to advanced OOPS concepts, collections, and exception handling.', ARRAY['Java Basics','OOPS','Collections','Exception Handling','Multithreading'], '₹5,000', 5000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Object-oriented programming','Industry-relevant curriculum','Project-based learning'], ARRAY['Java Developer Trainee','Software Engineer','Backend Developer'], ARRAY['IntelliJ IDEA','VS Code','JDK'], 'Weekdays: 9 AM - 11 AM', '10-15 students', 'active'),
('advanced-java', 'Advanced Java', 'Adv Java', '2 Months', 'short-term', 'Advanced Java with JDBC and Servlets', 'Learn advanced Java concepts including JDBC, Servlets, JSP, and web application development.', ARRAY['JDBC','Servlets','JSP','Web Applications','Deployment'], '₹6,000', 6000, 'Core Java knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Web application development','Database connectivity','Real-world projects'], ARRAY['Java Web Developer','Full Stack Developer','Backend Developer'], ARRAY['IntelliJ IDEA','Tomcat','MySQL','VS Code'], 'Weekdays: 9 AM - 11 AM', '10-15 students', 'active'),
('javascript', 'JavaScript', 'JS', '1 Month', 'short-term', 'JavaScript programming fundamentals', 'Learn JavaScript from basics to advanced concepts including DOM manipulation, ES6+, and async programming.', ARRAY['JS Basics','DOM','ES6+','Async/Await','Events'], '₹3,000', 3000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Modern JavaScript (ES6+)','DOM manipulation','Async programming'], ARRAY['Front-End Developer','Web Designer','UI Developer'], ARRAY['VS Code','Chrome Browser','Node.js'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('angular-js', 'Angular JS', 'Angular', '1 Month', 'short-term', 'Angular framework for web applications', 'Learn Angular framework for building dynamic web applications.', ARRAY['Angular Basics','Components','Services','Routing','HTTP Client'], '₹4,000', 4000, 'JavaScript knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Modern framework','Component-based architecture','Real projects'], ARRAY['Front-End Developer','Angular Developer','Web Developer'], ARRAY['VS Code','Angular CLI','Node.js'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('html', 'HTML', 'HTML', '10 Days', 'short-term', 'HTML5 web page structure', 'Learn HTML5 for creating structured web pages.', ARRAY['HTML5 Basics','Forms','Tables','Media','Semantic HTML'], '₹1,000', 1000, 'No prior experience needed', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Hands-on practice','Real-world examples','Portfolio project'], ARRAY['Foundation for web development'], ARRAY['VS Code','Chrome Browser'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('css', 'CSS', 'CSS', '15 Days', 'short-term', 'CSS3 styling and layout', 'Learn CSS3 for styling web pages including flexbox, grid, and responsive design.', ARRAY['CSS3 Basics','Flexbox','Grid','Responsive Design','Animations'], '₹1,500', 1500, 'HTML knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Modern CSS layout','Responsive design','Beautiful designs'], ARRAY['Foundation for web development'], ARRAY['VS Code','Chrome Browser'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('bootstrap', 'Bootstrap', 'Bootstrap', '15 Days', 'short-term', 'Bootstrap framework for responsive design', 'Learn Bootstrap framework for building responsive, mobile-first websites.', ARRAY['Bootstrap 5','Grid System','Components','Utilities','Responsive Design'], '₹1,500', 1500, 'HTML & CSS knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Rapid prototyping','Mobile-first design','Ready-made components'], ARRAY['Foundation for web development'], ARRAY['VS Code','Bootstrap CDN'], 'Weekdays: 9 AM - 10 AM', '10-15 students', 'active'),
('core-python', 'Core Python', 'Python', '1.5 Months', 'short-term', 'Core Python programming', 'Learn Python programming from basics to advanced concepts.', ARRAY['Python Basics','Data Types','Functions','OOPS','File Handling'], '₹4,000', 4000, 'Basic computer knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['Easy to learn syntax','Versatile language','Project-based learning'], ARRAY['Python Developer Trainee','Automation Tester','Data Analyst Junior'], ARRAY['VS Code','PyCharm','Python IDLE'], 'Weekdays: 9 AM - 10:30 AM', '10-15 students', 'active'),
('oops-python', 'Oops Python', 'OOPS Python', '15 Days', 'short-term', 'Object-Oriented Programming with Python', 'Learn OOPS concepts in Python including classes, inheritance, polymorphism, and design patterns.', ARRAY['Classes & Objects','Inheritance','Polymorphism','Encapsulation','Design Patterns'], '₹2,500', 2500, 'Core Python knowledge', 'Course Completion Certificate', 'TNGC Institute', false, ARRAY['OOP mastery','Design patterns','Real-world applications'], ARRAY['Python Developer','Software Engineer'], ARRAY['VS Code','PyCharm'], 'Weekdays: 9 AM - 10:30 AM', '10-15 students', 'active');

-- ============================================
-- SEED DATA: Faculty
-- ============================================

INSERT INTO faculty (name, role, branch, qualifications, description, is_founder) VALUES
('Mr. Mada Eswar Rao', 'Founder & Director', 'Ramanthapur', ARRAY['MCA Gold Medalist','M.Tech'], 'With over 24 years of experience in computer education, Mr. Mada Eswar Rao has been instrumental in shaping the careers of thousands of students. His vision and dedication have made TNGC one of the most trusted computer training institutes in Hyderabad.', true),
('Mrs. S Sowmya', 'Manager', 'Ramanthapur', ARRAY['MCA','5+ Years Experience'], NULL, false),
('Mr. V Rajesh', 'Coding Trainer', 'Ramanthapur', ARRAY['B.Tech','3+ Years Experience'], NULL, false),
('Mrs. K Lavanya', 'Computer Trainer', 'Ramanthapur', ARRAY['MCA','4+ Years Experience'], NULL, false),
('Mrs. P Soundarya', 'Accountant', 'Ramanthapur', ARRAY['M.Com','5+ Years Experience'], NULL, false);
