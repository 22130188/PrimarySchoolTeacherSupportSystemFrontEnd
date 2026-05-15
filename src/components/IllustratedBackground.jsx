import heroTeacherLeft from '../assets/images/hero-teacher-left.png';
import heroStudentsRight from '../assets/images/hero-students-right.png';

export default function IllustratedBackground({
    children,
    className = '',
    as: Tag = 'div',
    gradient = 'linear-gradient(135deg, #ede9fe 0%, #f3e8ff 35%, #fdf4ff 65%, #f0fdf4 100%)',
    imageOpacity = 0.5,
    imageHeight = 'h-[70%] max-h-[550px]',
    showOnMobile = false,
}) {
    const visibilityCls = showOnMobile ? '' : 'hidden lg:block';

    return (
        <Tag
            className={`min-h-screen relative overflow-hidden ${className}`}
            style={{ background: gradient }}
        >
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-violet-300/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-pink-200/20 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-teal-100/15 blur-3xl pointer-events-none" />

            <img
                src={heroTeacherLeft}
                alt=""
                className={`absolute bottom-0 left-0 ${imageHeight} object-contain select-none ${visibilityCls}`}
                style={{
                    opacity: imageOpacity,
                    maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                    maskComposite: 'intersect',
                    WebkitMaskComposite: 'source-in',
                    animation: 'illustSlideIn 1s ease-out both',
                }}
            />

            <img
                src={heroStudentsRight}
                alt=""
                className={`absolute bottom-0 right-0 ${imageHeight} object-contain select-none ${visibilityCls}`}
                style={{
                    opacity: imageOpacity,
                    maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%)',
                    maskComposite: 'intersect',
                    WebkitMaskComposite: 'source-in',
                    animation: 'illustSlideIn 1s ease-out 0.2s both',
                }}
            />


            {children}


            <style>{`
                @keyframes illustSlideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: ${imageOpacity}; transform: translateY(0); }
                }
                @keyframes illustCardIn {
                    from { opacity: 0; transform: translateY(15px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </Tag>
    );
}
