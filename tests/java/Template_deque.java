import java.util.*;

public class Template_deque {
static int[] maximum(int[] a,int k) {
    if(k<1 || k>a.length) throw new IllegalArgumentException();
    Deque<Integer> q = new ArrayDeque<>();
    int[] out=new int[a.length-k+1];
    for(int i=0;i<a.length;i++) {
        while(!q.isEmpty() && q.peekFirst()<=i-k) q.removeFirst();
        while(!q.isEmpty() && a[q.peekLast()]<=a[i]) q.removeLast();
        q.addLast(i);
        if(i>=k-1) out[i-k+1]=a[q.peekFirst()];
    }
    return out;
}
}
