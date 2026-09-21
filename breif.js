// ============================================
// BASIC APPLICATION DATABASE SCHEMA
// ============================================


// ============================================
// 1. USER / STUDENT REGISTRATION
// ============================================

const registrationSchema = {
    id: string,
    // Personal Information
    name: string,
    email: string,
    password: string,
    confirmPassword: string, // Usually frontend only, don't store in database
    fathersName: string,
    mobileNumber: string,
    parentMobileNumber: string,
    // Education Information
    branch: string,
    course: [
        {
            courseId: string,
            courseName: string,
            joiningDate: date,
            status: string, // active, completed, dropped
        }
    ],
    // Current Status
    presentStatus: string,
    // Allowed values:
    // student
    // employed
    // housewife
    // business
    // others
    // Signature
    fullNameAsSignature: string,
    // Dates
    joiningDate: date,
    // Account Status
    isActive: boolean,
    createdAt: date,
    updatedAt: date,
};
// ============================================
// 2. ATTENDANCE
// ============================================

const attendanceSchema = {
    id: string,
    studentId: string,
    courseId: string,
    date: date,
    status: string,
    // present
    // absent
    // late
    // leave
    markedBy: string,
    remarks: string,
    createdAt: date,
    updatedAt: date,
};


// ============================================
// 3. FEE PAYMENT
// ============================================

const feePaymentSchema = {
    id: string,
    studentId: string,
    courseId: string,
    amount: number,
    paymentDate: date,
    paymentMethod: string,
    // cash
    // upi
    // bank_transfer
    // card
    transactionId: string,
    receiptNumber: string,
    status: string,
    // paid
    // pending
    // failed
    remarks: string,
    collectedBy: string,
    createdAt: date,
    updatedAt: date,
};


// ============================================
// 4. NOTICE
// ============================================

const noticeSchema = {
    id: string,
    title: string,
    description: string,
    category: string,
    // general
    // course
    // exam
    // fee
    // event
    // important
    targetAudience: string,
    // all
    // students
    // specific_course
    // specific_students
    courseIds: [],
    studentIds: [],
    publishedBy: string,
    publishDate: date,
    expiryDate: date,
    isActive: boolean,
    createdAt: date,
    updatedAt: date,
};


// ============================================
// 5. COURSE
// ============================================

const courseSchema = {
    id: string,
    courseName: string,
    courseCode: string,
    description: string,
    duration: string,
    totalFee: number,
    branchId: string,
    instructorId: string,
    status: string,
    // active
    // inactive
    createdAt: date,
    updatedAt: date,
};


// ============================================
// 6. BRANCH
// ============================================

const branchSchema = {
    id: string,
    branchName: string,
    address: string,
    mobileNumber: string,
    email: string,
    branchHead: string,
    isActive: boolean,
    createdAt: date,
    updatedAt: date,
};


// ============================================
// 7. STAFF / ADMIN
// ============================================

const staffSchema = {
    id: string,
    name: string,
    email: string,
    password: string,
    mobileNumber: string,
    role: string,
    // super_admin
    // admin
    // teacher
    // staff
    branchId: string,
    isActive: boolean,
    createdAt: date,
    updatedAt: date,
};


// ============================================
// 8. STUDENT COURSE ENROLLMENT
// ============================================

const enrollmentSchema = {
    id: string,
    studentId: string,
    courseId: string,
    joiningDate: date,
    completionDate: date,
    status: string,
    // active
    // completed
    // dropped
    totalFee: number,
    discount: number,
    finalFee: number,
    createdAt: date,
    updatedAt: date,
};