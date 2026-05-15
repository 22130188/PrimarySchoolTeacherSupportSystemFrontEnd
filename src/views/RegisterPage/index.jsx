import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { registerAPI } from '../../services/authApi';
import Step1Role         from './components/Step1Role';
import Step2StudentInfo  from './components/Step2StudentInfo';
import Step2TeacherInfo  from './components/Step2TeacherInfo';
import Step3TeacherClass from './components/Step3TeacherClass';
import SuccessModal      from './components/SuccessModal';
import IllustratedBackground from '../../components/IllustratedBackground';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        role: '',
        name: '',            // → username
        email: '',
        school: '',          // → schoolName
        password: '',
        confirmPassword: '',
        otp: '',
        grade: '',           // học sinh
    });
    const [teacherClasses, setTeacherClasses] = useState([{ grade: '', subject: '' }]);
    const [showModal, setShowModal] = useState(false);
    const [apiError,  setApiError]  = useState('');
    const [loading,   setLoading]   = useState(false);

    const updateForm = (data) => setFormData((prev) => ({ ...prev, ...data }));

    const totalSteps = formData.role === 'teacher' ? 3 : 2;

    const handleRegister = async (classesFromStep3) => {
        setLoading(true);
        setApiError('');

        const basePayload = {
            username:   formData.name.trim(),
            email:      formData.email.trim(),
            password:   formData.password,
            role:       formData.role === 'teacher' ? 'TEACHER' : 'STUDENT',
            schoolName: formData.school.trim(),
        };

        const payload =
            formData.role === 'student'
                ? { ...basePayload, grade: formData.grade }
                : { ...basePayload, classes: classesFromStep3 };

        try {
            await registerAPI(payload);
            setShowModal(true);
        } catch (err) {
            setApiError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <IllustratedBackground className="font-sans">
            <div className="relative z-10 border-b border-white/40 bg-white/50 backdrop-blur-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

                <Link to="/"
                      className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-teal-400 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      title="Quay về trang chủ">
                    <BookOpen className="w-4 h-4 text-white" />
                </Link>

                <div className="flex items-center justify-center">
                    {[...Array(totalSteps)].map((_, i) => {
                        const s = i + 1;
                        return (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${step === s
                                    ? 'border-violet-500 text-violet-500 bg-white'
                                    : step > s
                                        ? 'border-violet-500 bg-violet-500 text-white'
                                        : 'border-gray-300 text-gray-400 bg-white/60'}`}>
                                    {step > s ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : s}
                                </div>
                                {i < totalSteps - 1 && (
                                    <div className={`w-10 sm:w-24 h-0.5 mx-1 transition-all duration-300 ${step > s ? 'bg-violet-400' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="shrink-0 text-sm text-gray-500">
                    <span className="hidden sm:inline">Đã có tài khoản?{' '}</span>
                    <Link to="/login" className="text-violet-600 font-semibold hover:underline">
                        Đăng nhập
                    </Link>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-65px)] py-12 px-4">

                {apiError && (
                    <div className="mb-4 w-full max-w-xl bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                        {apiError}
                    </div>
                )}

                {step === 1 && (
                    <Step1Role
                        selected={formData.role}
                        onSelect={(role) => updateForm({ role })}
                        onNext={() => setStep(2)}
                    />
                )}

                {step === 2 && formData.role === 'student' && (
                    <Step2StudentInfo
                        formData={formData}
                        onChange={updateForm}
                        onFinish={() => handleRegister(null)}
                        onBack={() => setStep(1)}
                        loading={loading}
                    />
                )}

                {step === 2 && formData.role === 'teacher' && (
                    <Step2TeacherInfo
                        formData={formData}
                        onChange={updateForm}
                        onNext={() => setStep(3)}
                        onBack={() => setStep(1)}
                    />
                )}

                {step === 3 && formData.role === 'teacher' && (
                    <Step3TeacherClass
                        classes={teacherClasses}
                        setClasses={setTeacherClasses}
                        onFinish={(classes) => handleRegister(classes)}
                        onBack={() => setStep(2)}
                        loading={loading}
                    />
                )}
            </div>

            {showModal && (
                <SuccessModal name={formData.name} onClose={() => navigate('/login')} />
            )}
        </IllustratedBackground>
    );
}