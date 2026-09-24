import java.util.*;

public class Template_power {
static double power(double x,int exponent) {
    long n=exponent; // Widen before negating MIN_VALUE.
    if(n<0){x=1/x;n=-n;}
    double out=1;
    while(n>0){if((n&1)==1)out*=x;x*=x;n>>=1;}
    return out; // Floating point rounding applies.
}
}
