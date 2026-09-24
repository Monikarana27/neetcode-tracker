import java.util.*;

public class Template_dp {
static long stairs(int n) {
    if(n<0 || n>91) throw new IllegalArgumentException();
    long before=1,current=1;
    for(int i=2;i<=n;i++){long next=before+current;before=current;current=next;}
    return current; // ways(0)=1; long still has finite range.
}
}
